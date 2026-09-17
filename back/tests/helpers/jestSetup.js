const { closePool } = require("../../db");
const { createTestSchema, cleanDatabase } = require("./database");

let schemaReady = false;

beforeAll(async () => {
  await createTestSchema();
  schemaReady = true;
}, 30_000);

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  try {
    if (schemaReady) await cleanDatabase();
  } finally {
    await closePool();
  }
});
