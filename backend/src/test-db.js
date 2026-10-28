// Test-only PostgreSQL access. The URL must be injected through Render secrets.
import pg from "pg";

export function createTestPool(env = process.env) {
  if (env.ENABLE_TEST_ORDER_STORAGE !== "true") throw Error("Test order storage disabled");
  if (!env.DATABASE_URL || !env.DATABASE_URL.startsWith("postgresql://")) throw Error("Private PostgreSQL DATABASE_URL required");
  if (!env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) throw Error("Stripe test key required");
  return new pg.Pool({connectionString:env.DATABASE_URL,max:3,connectionTimeoutMillis:5000, idleTimeoutMillis:10000});
}

export async function storeTestEvent(pool, verified) {
  const {recordVerifiedTestEvent} = await import("./test-order-store.js");
  const client = await pool.connect();
  try { return await recordVerifiedTestEvent(client, verified); }
  finally { client.release(); }
}
