// Run ONLY against the isolated Render test PostgreSQL database.
// Usage from a private Render shell: cd backend && npm run db:migrate:test
import fs from "node:fs/promises";
import pg from "pg";

if (process.env.ENABLE_TEST_ORDER_STORAGE !== "true" ||
    process.env.CONFIRM_TEST_DB_MIGRATION !== "jessica_books_orders_test" ||
    !process.env.DATABASE_URL?.startsWith("postgresql://")) {
  console.error("Test migration blocked: explicit test-only settings required");
  process.exitCode = 1;
} else {
  const client = new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});
  try {
    await client.connect();
    const identity = await client.query("SELECT current_database() AS name");
    if(identity.rows[0]?.name !== "jessica_books_orders_test") throw Error("Unexpected database; migration refused");
    const sql = await fs.readFile(new URL("../sql/001_test_orders.sql",import.meta.url),"utf8");
    await client.query(sql);
    const tables=await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('stripe_test_events','stripe_test_orders')");
    if(tables.rowCount!==2)throw Error("Test tables not verified");
    console.log("Test-only schema verified");
  }catch(error){
    console.error("Test migration failed:",error?.message||"unknown");
    process.exitCode=1;
  }finally{await client.end().catch(()=>{});}
}
