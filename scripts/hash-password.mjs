import bcrypt from "bcryptjs";

// 用法: node scripts/hash-password.mjs [password]
const password = process.argv[2] || "admin123";
const hash = await bcrypt.hash(password, 10);
console.log(hash);
