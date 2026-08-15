import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit CLI 不会自动加载 .env.local，这里显式加载
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // 该 Supabase public schema 下还有其他业务表，push 仅处理本项目表
  tablesFilter: "serial_numbers",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
    ssl: { rejectUnauthorized: false },
  },
});
