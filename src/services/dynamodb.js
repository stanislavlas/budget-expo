/**
 * DynamoDB Service
 * ----------------
 * When the user belongs to a household, listEntries queries by householdId
 * so all members see the same pool of transactions.
 * putEntry always stamps the entry with the current user's userId (for attribution).
 */

import { authRequest } from "./auth.js";

export function newEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listEntries(yearMonth = null, householdId = null) {
  const params = new URLSearchParams();
  if (yearMonth)   params.set("yearMonth",   yearMonth);
  if (householdId) params.set("householdId", householdId);
  const qs = params.toString();
  return authRequest(`/entries${qs ? "?" + qs : ""}`);
}

export async function putEntry(entry) {
  return authRequest("/entries", {
    method: "PUT",
    body: JSON.stringify(entry),
  });
}

export async function deleteEntry(entryId) {
  return authRequest(`/entries/${entryId}`, { method: "DELETE" });
}
