const { drizzle } = await import("drizzle-orm/postgres-js");
const { migrate } = await import("drizzle-orm/postgres-js/migrator");
const { default: postgres } = await import("postgres");

import { config } from "dotenv";
config({
  path: ".env.local",
});

const migrationsFolderName = process.env.MIGRATIONS_FOLDER || "drizzle";
let sslMode: string | boolean = process.env.SSL || "require";

if (sslMode === "false") sslMode = false;

let connectionString =
  "postgresql://tolga:50LOjyzBJAKt@ep-falling-truth-a5bsyz5s.us-east-2.aws.neon.tech/neondb";

const isDevContainer = process.env.REMOTE_CONTAINERS !== undefined;
if (isDevContainer)
  connectionString = connectionString.replace(
    "localhost",
    "host.docker.internal"
  );

console.log("connectionString", connectionString);
const sql = postgres(connectionString, { max: 1, ssl: sslMode as any });
const db = drizzle(sql, {
  logger: true,
});

let retries = 5;
while (retries) {
  try {
    await sql`SELECT NOW()`;
    console.log("Database is live");
    break;
  } catch (error) {
    console.error("Database is not live yet", error);
    retries -= 1;
    console.log(`Retries left: ${retries}`);
    await new Promise((res) => setTimeout(res, 1000));
  }
}

console.log("Migrating...");
await migrate(db, { migrationsFolder: migrationsFolderName });
console.log("Done!");
process.exit();
