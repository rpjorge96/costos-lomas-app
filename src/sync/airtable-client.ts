import PQueue from "p-queue";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

// One queue per base to respect per-base rate limits (5 req/sec)
const baseQueues = new Map<string, PQueue>();

function getQueue(baseId: string): PQueue {
  if (!baseQueues.has(baseId)) {
    baseQueues.set(
      baseId,
      new PQueue({
        concurrency: 1,
        interval: 220, // ~4.5 req/sec, safely under 5/sec limit
        intervalCap: 1,
      })
    );
  }
  return baseQueues.get(baseId)!;
}

export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

class UnknownFieldError extends Error {
  fieldName: string;
  constructor(fieldName: string) {
    super(`Unknown field: ${fieldName}`);
    this.fieldName = fieldName;
  }
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  maxRetries = 3
): Promise<AirtableListResponse> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, { headers });

    if (response.ok) {
      return response.json() as Promise<AirtableListResponse>;
    }

    if (response.status === 429 && attempt < maxRetries) {
      // Rate limited - wait with exponential backoff
      const waitMs = Math.pow(2, attempt + 1) * 1000;
      console.warn(
        `  Rate limited (429). Waiting ${waitMs}ms before retry ${attempt + 1}/${maxRetries}...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    const errorText = await response.text();

    // Detect unknown field errors (422) and propagate for retry without that field
    if (response.status === 422) {
      try {
        const errorJson = JSON.parse(errorText);
        const message: string = errorJson?.error?.message ?? "";
        const match = message.match(/Unknown field name: "([^"]+)"/);
        if (match) {
          throw new UnknownFieldError(match[1]);
        }
      } catch (parseErr) {
        if (parseErr instanceof UnknownFieldError) throw parseErr;
        // If JSON parse fails, fall through to generic error
      }
    }

    throw new Error(
      `Airtable API error ${response.status}: ${errorText.slice(0, 200)}`
    );
  }

  throw new Error("Max retries exceeded");
}

/**
 * Fetch all records from a table with pagination, respecting rate limits.
 * Automatically retries without fields that don't exist in a given base.
 */
export async function fetchAllRecords(
  baseId: string,
  tableId: string,
  fieldIds: string[]
): Promise<AirtableRecord[]> {
  const token = process.env.AIRTABLE_PAT;
  if (!token) throw new Error("AIRTABLE_PAT environment variable is not set");

  // Copy field list — we may remove fields that don't exist in this base
  let activeFieldIds = [...fieldIds];

  const queue = getQueue(baseId);
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams();
    activeFieldIds.forEach((fid) => params.append("fields[]", fid));
    params.set("returnFieldsByFieldId", "true");
    if (offset) params.set("offset", offset);

    const url = `${AIRTABLE_API_BASE}/${baseId}/${tableId}?${params.toString()}`;

    try {
      const result = await queue.add(
        () =>
          fetchWithRetry(url, {
            Authorization: `Bearer ${token}`,
          }),
        {}
      );

      if (result) {
        allRecords.push(...result.records);
        offset = result.offset;
        hasMore = !!offset;
      } else {
        hasMore = false;
      }

      page++;
      if (page % 5 === 0) {
        process.stdout.write(
          `    ...${allRecords.length} records fetched (page ${page})\r`
        );
      }
    } catch (err) {
      if (err instanceof UnknownFieldError) {
        // Remove the unknown field and retry this page (don't advance offset)
        console.warn(
          `    ⚠ Field ${err.fieldName} not found in this base, skipping it`
        );
        activeFieldIds = activeFieldIds.filter((f) => f !== err.fieldName);
        // loop continues — retries same page without the problematic field
      } else {
        throw err;
      }
    }
  }

  return allRecords;
}
