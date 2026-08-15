// 用 pg 直接执行 drizzle 生成的 SQL 迁移文件
// 适用于 public schema 下存在其他业务对象的共享数据库（drizzle-kit push 会要求交互式确认重命名）
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "drizzle");

if (!process.env.DATABASE_URL) {
  console.error("缺少 DATABASE_URL 环境变量");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  const sql = readFileSync(path.join(migrationsDir, file), "utf-8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log(`已应用迁移: ${file}`);
}

await pool.end();
console.log("数据库迁移完成");
