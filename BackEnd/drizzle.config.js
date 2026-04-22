import dotenv from "dotenv";
dotenv.config();
console.log(process.env.DB_HOST);
console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);
    console.log(process.env.DB_NAME);
        console.log(process.env.DB_PORT);
/** @type {import("drizzle-kit").Config} */
export default {
  schema: "./src/models/schema.js",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
  },
};
