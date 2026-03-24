/**
 * Household Service
 * -----------------
 * A household lets multiple users share one pool of entries.
 * Only the owner can add/remove members.
 * All members (owner included) see all entries in the household.
 *
 * DynamoDB table: budget_households
 *   PK: householdId (String) — uuid v4
 *   Attributes:
 *     name        (String)
 *     ownerUserId (String)
 *     members     (List<Map>) — [{ userId, name, email, joinedAt }]
 *     createdAt   (Number)
 *
 * The user record in budget_users also stores:
 *   householdId  (String | null)
 *   householdRole ("owner" | "member" | null)
 */

import { authRequest } from "./auth.js";

/** Get the current user's household (null if not in one) */
export async function getMyHousehold() {
  return authRequest("/household");
}

/** Create a new household. The caller becomes owner. */
export async function createHousehold(name) {
  return authRequest("/household", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

/** Owner: add a member by email */
export async function addMember(email) {
  return authRequest("/household/members", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/** Owner: remove a member by userId */
export async function removeMember(userId) {
  return authRequest(`/household/members/${userId}`, { method: "DELETE" });
}

/** Any member: leave the household (owner must transfer or delete first) */
export async function leaveHousehold() {
  return authRequest("/household/leave", { method: "POST" });
}

/** Owner: delete the entire household (all members are unlinked, data stays) */
export async function deleteHousehold() {
  return authRequest("/household", { method: "DELETE" });
}

/** Owner: rename the household */
export async function renameHousehold(name) {
  return authRequest("/household", {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}
