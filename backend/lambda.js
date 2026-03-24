/**
 * Budget App Lambda Handler
 * Handles all API routes for auth, entries, households, and categories
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import crypto from "crypto";

// Environment
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-minimum-32-characters-long";
const TABLE_USERS = process.env.TABLE_USERS || "budget_users";
const TABLE_TOKENS = process.env.TABLE_TOKENS || "budget_refresh_tokens";
const TABLE_ENTRIES = process.env.TABLE_ENTRIES || "budget_entries";
const TABLE_HOUSEHOLDS = process.env.TABLE_HOUSEHOLDS || "budget_households";
const TABLE_CATEGORIES = process.env.TABLE_CATEGORIES || "budget_categories";

// DynamoDB client
const endpoint = process.env.AWS_ENDPOINT_URL;
const client = new DynamoDBClient(endpoint ? { endpoint } : {});
const ddb = DynamoDBDocumentClient.from(client);

// Helpers
function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(body),
  };
}

function error(message, statusCode = 400) {
  return respond(statusCode, { error: message });
}

function generateAccessToken(user) {
  return jwt.sign({ userId: user.userId, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function getUserById(userId) {
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLE_USERS, Key: { userId } }));
  return Item || null;
}

async function getUserByEmail(email) {
  const { Items } = await ddb.send(new QueryCommand({
    TableName: TABLE_USERS,
    IndexName: "email-index",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: { ":email": email },
  }));
  return Items?.[0] || null;
}

// Auth middleware
async function authenticate(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  return getUserById(payload.userId);
}

// Routes
async function handleRegister(body) {
  const { name, email, password } = body;
  if (!name || !email || !password) return error("Missing required fields");
  if (password.length < 8) return error("Password must be at least 8 characters");

  const existing = await getUserByEmail(email);
  if (existing) return error("Email already registered", 409);

  const userId = uuid();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    userId,
    name,
    email,
    passwordHash,
    createdAt: Date.now(),
    householdId: null,
    householdRole: null,
  };

  await ddb.send(new PutCommand({ TableName: TABLE_USERS, Item: user }));

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  await ddb.send(new PutCommand({
    TableName: TABLE_TOKENS,
    Item: { tokenHash, userId, createdAt: Date.now(), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
  }));

  const { passwordHash: _, ...userPublic } = user;
  return respond(200, { user: userPublic, accessToken, refreshToken });
}

async function handleLogin(body) {
  const { email, password } = body;
  if (!email || !password) return error("Missing email or password");

  const user = await getUserByEmail(email);
  if (!user) return error("Invalid credentials", 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return error("Invalid credentials", 401);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  await ddb.send(new PutCommand({
    TableName: TABLE_TOKENS,
    Item: { tokenHash, userId: user.userId, createdAt: Date.now(), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
  }));

  const { passwordHash: _, ...userPublic } = user;
  return respond(200, { user: userPublic, accessToken, refreshToken });
}

async function handleRefresh(body) {
  const { refreshToken } = body;
  if (!refreshToken) return error("Missing refresh token");

  const tokenHash = hashToken(refreshToken);
  const { Item: tokenDoc } = await ddb.send(new GetCommand({ TableName: TABLE_TOKENS, Key: { tokenHash } }));
  if (!tokenDoc) return error("Invalid or expired token", 401);

  const user = await getUserById(tokenDoc.userId);
  if (!user) return error("User not found", 401);

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);

  await ddb.send(new DeleteCommand({ TableName: TABLE_TOKENS, Key: { tokenHash } }));
  await ddb.send(new PutCommand({
    TableName: TABLE_TOKENS,
    Item: { tokenHash: newTokenHash, userId: user.userId, createdAt: Date.now(), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
  }));

  return respond(200, { accessToken, refreshToken: newRefreshToken });
}

async function handleLogout(body) {
  const { refreshToken } = body;
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await ddb.send(new DeleteCommand({ TableName: TABLE_TOKENS, Key: { tokenHash } })).catch(() => {});
  }
  return respond(200, { message: "Logged out" });
}

async function handleDeleteAccount(user, body) {
  const { password } = body;
  if (!password) return error("Password required");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return error("Invalid password", 401);

  // Delete all refresh tokens
  const { Items: tokens } = await ddb.send(new ScanCommand({
    TableName: TABLE_TOKENS,
    FilterExpression: "userId = :userId",
    ExpressionAttributeValues: { ":userId": user.userId },
  }));
  for (const token of tokens || []) {
    await ddb.send(new DeleteCommand({ TableName: TABLE_TOKENS, Key: { tokenHash: token.tokenHash } }));
  }

  // Delete user
  await ddb.send(new DeleteCommand({ TableName: TABLE_USERS, Key: { userId: user.userId } }));

  return respond(200, { message: "Account deleted" });
}

async function handleChangePassword(user, body) {
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) return error("Missing passwords");
  if (newPassword.length < 8) return error("New password must be at least 8 characters");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return error("Current password is incorrect", 401);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await ddb.send(new UpdateCommand({
    TableName: TABLE_USERS,
    Key: { userId: user.userId },
    UpdateExpression: "SET passwordHash = :hash",
    ExpressionAttributeValues: { ":hash": passwordHash },
  }));

  return respond(200, { message: "Password changed" });
}

// Entries
async function handleListEntries(user, query) {
  const { yearMonth, householdId } = query;

  let result;
  if (householdId) {
    result = await ddb.send(new QueryCommand({
      TableName: TABLE_ENTRIES,
      IndexName: "householdId-index",
      KeyConditionExpression: "householdId = :hid",
      ExpressionAttributeValues: { ":hid": householdId },
    }));
  } else {
    result = await ddb.send(new QueryCommand({
      TableName: TABLE_ENTRIES,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": user.userId },
    }));
  }

  let entries = result.Items || [];
  if (yearMonth) {
    entries = entries.filter(e => e.date?.startsWith(yearMonth));
  }

  return respond(200, entries);
}

async function handlePutEntry(user, body) {
  const entry = {
    ...body,
    userId: user.userId,
    entryId: body.entryId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };

  await ddb.send(new PutCommand({ TableName: TABLE_ENTRIES, Item: entry }));
  return respond(200, entry);
}

async function handleDeleteEntry(user, entryId) {
  await ddb.send(new DeleteCommand({
    TableName: TABLE_ENTRIES,
    Key: { userId: user.userId, entryId },
  }));
  return respond(200, { message: "Entry deleted" });
}

// Household
async function handleGetHousehold(user) {
  if (!user.householdId) return respond(200, null);

  const { Item: household } = await ddb.send(new GetCommand({
    TableName: TABLE_HOUSEHOLDS,
    Key: { householdId: user.householdId },
  }));

  if (!household) return respond(200, null);
  return respond(200, { ...household, role: user.householdRole });
}

async function handleCreateHousehold(user, body) {
  const { name } = body;
  if (!name) return error("Household name required");
  if (user.householdId) return error("Already in a household", 409);

  const householdId = uuid();
  const household = {
    householdId,
    name,
    ownerUserId: user.userId,
    members: [{ userId: user.userId, name: user.name, email: user.email, joinedAt: Date.now() }],
    createdAt: Date.now(),
  };

  await ddb.send(new PutCommand({ TableName: TABLE_HOUSEHOLDS, Item: household }));
  await ddb.send(new UpdateCommand({
    TableName: TABLE_USERS,
    Key: { userId: user.userId },
    UpdateExpression: "SET householdId = :hid, householdRole = :role",
    ExpressionAttributeValues: { ":hid": householdId, ":role": "owner" },
  }));

  return respond(200, { ...household, role: "owner" });
}

async function handleAddMember(user, body) {
  const { email } = body;
  if (!email) return error("Email required");
  if (!user.householdId) return error("Not in a household", 403);
  if (user.householdRole !== "owner") return error("Only owner can add members", 403);

  const member = await getUserByEmail(email);
  if (!member) return error("User not found", 404);
  if (member.householdId) return error("User already in a household", 409);

  const { Item: household } = await ddb.send(new GetCommand({
    TableName: TABLE_HOUSEHOLDS,
    Key: { householdId: user.householdId },
  }));
  if (!household) return error("Household not found", 404);

  const newMember = { userId: member.userId, name: member.name, email: member.email, joinedAt: Date.now() };
  household.members.push(newMember);

  await ddb.send(new PutCommand({ TableName: TABLE_HOUSEHOLDS, Item: household }));
  await ddb.send(new UpdateCommand({
    TableName: TABLE_USERS,
    Key: { userId: member.userId },
    UpdateExpression: "SET householdId = :hid, householdRole = :role",
    ExpressionAttributeValues: { ":hid": user.householdId, ":role": "member" },
  }));

  return respond(200, { ...household, role: user.householdRole });
}

async function handleRemoveMember(user, memberUserId) {
  if (!user.householdId) return error("Not in a household", 403);
  if (user.householdRole !== "owner") return error("Only owner can remove members", 403);
  if (memberUserId === user.userId) return error("Owner cannot remove themselves", 400);

  const { Item: household } = await ddb.send(new GetCommand({
    TableName: TABLE_HOUSEHOLDS,
    Key: { householdId: user.householdId },
  }));
  if (!household) return error("Household not found", 404);

  household.members = household.members.filter(m => m.userId !== memberUserId);
  await ddb.send(new PutCommand({ TableName: TABLE_HOUSEHOLDS, Item: household }));
  await ddb.send(new UpdateCommand({
    TableName: TABLE_USERS,
    Key: { userId: memberUserId },
    UpdateExpression: "SET householdId = :null, householdRole = :null",
    ExpressionAttributeValues: { ":null": null },
  }));

  return respond(200, { ...household, role: user.householdRole });
}

async function handleLeaveHousehold(user) {
  if (!user.householdId) return error("Not in a household", 400);
  if (user.householdRole === "owner") return error("Owner must delete household or transfer ownership", 403);

  const { Item: household } = await ddb.send(new GetCommand({
    TableName: TABLE_HOUSEHOLDS,
    Key: { householdId: user.householdId },
  }));
  if (household) {
    household.members = household.members.filter(m => m.userId !== user.userId);
    await ddb.send(new PutCommand({ TableName: TABLE_HOUSEHOLDS, Item: household }));
  }

  await ddb.send(new UpdateCommand({
    TableName: TABLE_USERS,
    Key: { userId: user.userId },
    UpdateExpression: "SET householdId = :null, householdRole = :null",
    ExpressionAttributeValues: { ":null": null },
  }));

  return respond(200, { message: "Left household" });
}

async function handleDeleteHousehold(user) {
  if (!user.householdId) return error("Not in a household", 400);
  if (user.householdRole !== "owner") return error("Only owner can delete household", 403);

  const { Item: household } = await ddb.send(new GetCommand({
    TableName: TABLE_HOUSEHOLDS,
    Key: { householdId: user.householdId },
  }));
  if (!household) return error("Household not found", 404);

  // Unlink all members
  for (const member of household.members) {
    await ddb.send(new UpdateCommand({
      TableName: TABLE_USERS,
      Key: { userId: member.userId },
      UpdateExpression: "SET householdId = :null, householdRole = :null",
      ExpressionAttributeValues: { ":null": null },
    }));
  }

  await ddb.send(new DeleteCommand({ TableName: TABLE_HOUSEHOLDS, Key: { householdId: user.householdId } }));
  return respond(200, { message: "Household deleted" });
}

async function handleRenameHousehold(user, body) {
  const { name } = body;
  if (!name) return error("Name required");
  if (!user.householdId) return error("Not in a household", 400);
  if (user.householdRole !== "owner") return error("Only owner can rename household", 403);

  await ddb.send(new UpdateCommand({
    TableName: TABLE_HOUSEHOLDS,
    Key: { householdId: user.householdId },
    UpdateExpression: "SET #name = :name",
    ExpressionAttributeNames: { "#name": "name" },
    ExpressionAttributeValues: { ":name": name },
  }));

  const { Item: household } = await ddb.send(new GetCommand({
    TableName: TABLE_HOUSEHOLDS,
    Key: { householdId: user.householdId },
  }));

  return respond(200, { ...household, role: user.householdRole });
}

// Categories
async function handleListCategories(user) {
  const { Items } = await ddb.send(new QueryCommand({
    TableName: TABLE_CATEGORIES,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": user.userId },
  }));
  return respond(200, Items || []);
}

async function handleCreateCategory(user, body) {
  const { label, emoji, type } = body;
  if (!label || !type) return error("Missing label or type");
  if (!["income", "expense"].includes(type)) return error("Type must be income or expense");

  const categoryId = `custom:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const category = { userId: user.userId, categoryId, label, emoji: emoji || "📦", type, createdAt: Date.now() };

  await ddb.send(new PutCommand({ TableName: TABLE_CATEGORIES, Item: category }));
  return respond(200, category);
}

async function handleDeleteCategory(user, categoryId) {
  await ddb.send(new DeleteCommand({
    TableName: TABLE_CATEGORIES,
    Key: { userId: user.userId, categoryId },
  }));
  return respond(200, { message: "Category deleted" });
}

// Main handler
export async function handler(event) {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.rawPath;
  const body = event.body ? JSON.parse(event.body) : {};
  const query = event.queryStringParameters || {};

  console.log(`${method} ${path}`);

  // CORS preflight
  if (method === "OPTIONS") {
    return respond(200, {});
  }

  // Public routes
  if (method === "POST" && path === "/auth/register") return handleRegister(body);
  if (method === "POST" && path === "/auth/login") return handleLogin(body);
  if (method === "POST" && path === "/auth/refresh") return handleRefresh(body);
  if (method === "POST" && path === "/auth/logout") return handleLogout(body);

  // Protected routes
  const user = await authenticate(event);
  if (!user) return error("Unauthorized", 401);

  // Auth routes
  if (method === "DELETE" && path === "/auth/account") return handleDeleteAccount(user, body);
  if (method === "PUT" && path === "/auth/password") return handleChangePassword(user, body);

  // Entry routes
  if (method === "GET" && path === "/entries") return handleListEntries(user, query);
  if (method === "PUT" && path === "/entries") return handlePutEntry(user, body);
  if (method === "DELETE" && path.startsWith("/entries/")) {
    const entryId = path.split("/")[2];
    return handleDeleteEntry(user, entryId);
  }

  // Household routes
  if (method === "GET" && path === "/household") return handleGetHousehold(user);
  if (method === "POST" && path === "/household") return handleCreateHousehold(user, body);
  if (method === "PUT" && path === "/household") return handleRenameHousehold(user, body);
  if (method === "DELETE" && path === "/household") return handleDeleteHousehold(user);
  if (method === "POST" && path === "/household/leave") return handleLeaveHousehold(user);
  if (method === "POST" && path === "/household/members") return handleAddMember(user, body);
  if (method === "DELETE" && path.startsWith("/household/members/")) {
    const memberUserId = path.split("/")[3];
    return handleRemoveMember(user, memberUserId);
  }

  // Category routes
  if (method === "GET" && path === "/categories") return handleListCategories(user);
  if (method === "POST" && path === "/categories") return handleCreateCategory(user, body);
  if (method === "DELETE" && path.startsWith("/categories/")) {
    const categoryId = path.split("/")[2];
    return handleDeleteCategory(user, categoryId);
  }

  return error("Not found", 404);
}
