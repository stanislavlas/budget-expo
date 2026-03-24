/**
 * Custom Categories Service
 * -------------------------
 * Users can create their own categories on top of the built-in ones.
 * Custom categories are stored in `budget_categories` DynamoDB table:
 *
 *   PK: userId     (String)
 *   SK: categoryId (String) — "custom:<timestamp>-<random>"
 *   Attributes: label, emoji, type ("income"|"expense"), createdAt
 *
 * The Lambda routes are:
 *   GET    /categories        → list user's custom categories
 *   POST   /categories        → create a new custom category
 *   DELETE /categories/:id    → delete a custom category
 */

import { authRequest } from "./auth.js";

export async function listCustomCategories() {
  return authRequest("/categories");
}

export async function createCustomCategory({ label, emoji, type }) {
  return authRequest("/categories", {
    method: "POST",
    body: JSON.stringify({ label, emoji, type }),
  });
}

export async function deleteCustomCategory(categoryId) {
  return authRequest(`/categories/${categoryId}`, { method: "DELETE" });
}
