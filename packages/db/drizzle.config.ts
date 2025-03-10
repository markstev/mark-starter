import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

console.log("db url is", process.env.DATABASE_URL);

export default defineConfig({
  verbose: true,
  schemaFilter: ["public"],
  schema: "./src/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
