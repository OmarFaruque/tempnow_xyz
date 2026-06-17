import { db } from './db';
import { quotes, users } from './schema';
import { eq, or, and, ilike, asc, desc, sql } from 'drizzle-orm';

export async function validatePolicyAccess(
  policyNumber: string,
  surname: string,
  dateOfBirth: string, // Format: YYYY-MM-DD
  postcode: string,
): Promise<{ isValid: boolean; policy?: any; error?: string }> {
  
  // Find the policy
  // Replace mock data lookup with database query
  // Assumes you have a Prisma client instance imported as `prisma`
  // and your schema defines a Policy model matching PolicyData fields

  // Import Prisma client at the top of your file:


 const [policy] = await db.select().from(quotes).where(eq(quotes.policyNumber, policyNumber));


  if (!policy) {
    return { isValid: false, error: "Policy not found" };
  }

  if (!policy) {
    return { isValid: false, error: "Policy not found" }
  }

  // Validate surname (case insensitive)
  if (policy.lastName?.toLowerCase() !== surname.toLowerCase().trim()) {
    return { isValid: false, error: "Surname does not match our records" };
  }

  if (!policy.dateOfBirth) {
    return { isValid: false, error: "Date of birth is missing in the policy record" };
  }

  // Validate date of birth
  const policyDateOfBirth = policy.dateOfBirth.split(' ')[0]; // Extract date part only
  const inputDateOfBirth = dateOfBirth; // Input is already in YYYY-MM-DD format

  
  if (policyDateOfBirth !== inputDateOfBirth) {
    return { isValid: false, error: "Date of birth does not match our records" };
  }

  // Validate postcode (remove spaces and compare case insensitive)
  const normalizePostcode = (pc: string) => pc.replace(/\s/g, "").toLowerCase()
  if (normalizePostcode(policy.postCode ?? '') !== normalizePostcode(postcode)) {
    return { isValid: false, error: "Postcode does not match our records" }
  }

  return { isValid: true, policy }
}

// Get all policies
type PolicySort =
  | "latest"
  | "oldest"
  | "expiring-soon"
  | "amount-high"
  | "amount-low"
  | "alphabetical"

interface GetPoliciesOptions {
  page: number
  pageSize: number
  status?: "pending" | "confirmed"
  searchTerm?: string
  sortBy?: PolicySort
}

const amountOrderExpression = () =>
  sql`COALESCE(NULLIF(${quotes.updatePrice}, ''), NULLIF(${quotes.cpw}, ''), '0')::numeric`

const getOrderByClause = (sortBy: PolicySort = "latest") => {
  switch (sortBy) {
    case "oldest":
      return [asc(quotes.createdAt)]
    case "expiring-soon":
      return [asc(quotes.endDate), desc(quotes.createdAt)]
    case "amount-high":
      return [sql`${amountOrderExpression()} DESC`]
    case "amount-low":
      return [sql`${amountOrderExpression()} ASC`]
    case "alphabetical":
      return [asc(quotes.firstName), asc(quotes.lastName)]
    case "latest":
    default:
      return [desc(quotes.createdAt)]
  }
}

export async function getPolicies({
  page,
  pageSize,
  status = "confirmed",
  searchTerm,
  sortBy = "latest",
}: GetPoliciesOptions) {
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : 25
  const offset = (normalizedPage - 1) * safePageSize
  const filters = [
    or(eq(quotes.paymentStatus, 'paid'), eq(quotes.paymentMethod, 'bank_transfer')),
  ]

  if (status === "pending") {
    filters.push(eq(quotes.status, 'pending'))
  } else if (status === "confirmed") {
    filters.push(sql`${quotes.status} <> 'pending'`)
  }

  if (searchTerm && searchTerm.trim().length > 0) {
    const term = `%${searchTerm.trim()}%`
    filters.push(
      or(
        ilike(quotes.firstName, term),
        ilike(quotes.lastName, term),
        ilike(quotes.regNumber, term),
        ilike(quotes.policyNumber, term),
        ilike(users.email, term),
      ),
    )
  }

  const whereClause = and(...filters)
  const orderByClause = getOrderByClause(sortBy)
  const joinCondition = eq(sql`CAST(${quotes.userId} AS INTEGER)`, users.userId)

  const [data, countResult] = await Promise.all([
    db
      .select({ policy: quotes, user: users })
      .from(quotes)
      .leftJoin(users, joinCondition)
      .where(whereClause)
      .orderBy(...orderByClause)
      .limit(safePageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)` })
      .from(quotes)
      .leftJoin(users, joinCondition)
      .where(whereClause),
  ])

  const total = countResult?.[0]?.total ?? 0

  return {
    data: data.map((item) => ({ ...item.policy, user: item.user })),
    total,
  }
}

// Create a new policy
export async function createPolicy(policyData: any) {
  return await db.insert(quotes).values(policyData).returning();
}

// Update a policy
export async function updatePolicy(policyId: number, policyData: any) {
  return await db.update(quotes).set(policyData).where(eq(quotes.id, policyId)).returning();
}

// Delete a policy
export async function deletePolicy(policyId: number) {

  const [policy] = await db
    .select({ policy: quotes, user: users })
    .from(quotes)
    .leftJoin(users, eq(sql`CAST(${quotes.userId} AS INTEGER)`, users.userId))
    .where(eq(quotes.id, policyId));

  const deletedPolicy = await db.delete(quotes).where(eq(quotes.id, policyId)).returning();

  if (!deletedPolicy.length) {
    return deletedPolicy;
  }
  return deletedPolicy.map((item) => ({
    ...item,
    user: policy?.user || null,
  }));
}

// Get all customers
export async function getCustomers() {
  const allUsers = await db.select().from(users);
  const allQuotes = await db.select().from(quotes);

  return allUsers.map((user) => {
    const userQuotes = allQuotes.filter((quote) => quote.userId === user.userId.toString());
    return {
      ...user,
      quotes: userQuotes,
      totalSpent: userQuotes.reduce((acc, quote) => acc + (Number(quote.quoteData) || 0), 0),
    };
  });
}


export async function getPolicyByNumber(policyNumber: string): Promise<any | null> {
  const [policy] = await db.select().from(quotes).where(eq(quotes.policyNumber, policyNumber));
  return policy || null;
}
