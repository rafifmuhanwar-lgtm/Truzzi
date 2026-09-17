const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Rafif211206@localhost:5432/truzzi_web?schema=public',
});

async function run() {
  await client.connect();
  try {
    // Add new enum values if they don't exist
    try { await client.query(ALTER TYPE "UserRole" ADD VALUE 'jastiper';); } catch (e) {}
    try { await client.query(ALTER TYPE "SenderRole" ADD VALUE 'jastiper';); } catch (e) {}
    
    // Update data
    await client.query(UPDATE "User" SET "role" = 'jastiper' WHERE "role" = 'courier';);
    await client.query(UPDATE "Order" SET "senderRole" = 'jastiper' WHERE "senderRole" = 'courier';);
    
    console.log("Database data updated successfully.");
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    await client.end();
  }
}
run();
