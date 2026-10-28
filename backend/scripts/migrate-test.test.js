import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";

const script=new URL("./migrate-test.js",import.meta.url);
const safeEnv={
  ...process.env,
  ENABLE_TEST_ORDER_STORAGE:"false",
  CONFIRM_TEST_DB_MIGRATION:"",
  DATABASE_URL:""
};

test("migration refuses execution without explicit storage opt-in",()=>{
  const result=spawnSync(process.execPath,[script.pathname],{env:{...safeEnv,DATABASE_URL:"postgresql://localhost/ignored"},encoding:"utf8",timeout:5000});
  assert.equal(result.status,1);
  assert.match(result.stderr,/Test migration blocked/);
});
test("migration refuses execution without exact test database confirmation",()=>{
  const result=spawnSync(process.execPath,[script.pathname],{env:{...safeEnv,ENABLE_TEST_ORDER_STORAGE:"true",CONFIRM_TEST_DB_MIGRATION:"production",DATABASE_URL:"postgresql://localhost/ignored"},encoding:"utf8",timeout:5000});
  assert.equal(result.status,1);
  assert.match(result.stderr,/Test migration blocked/);
});
test("migration refuses execution without PostgreSQL connection URL",()=>{
  const result=spawnSync(process.execPath,[script.pathname],{env:{...safeEnv,ENABLE_TEST_ORDER_STORAGE:"true",CONFIRM_TEST_DB_MIGRATION:"jessica_books_orders_test",DATABASE_URL:""},encoding:"utf8",timeout:5000});
  assert.equal(result.status,1);
  assert.match(result.stderr,/Test migration blocked/);
});
