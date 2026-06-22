// Here we define the database connection
import { createPool } from "mysql2/promise";

const parsedPort = Number.parseInt(process.env.DB_PORT ?? "", 10);
const dbPort = Number.isInteger(parsedPort) ? parsedPort : 3306;

const pool = createPool({
  host: process.env.DB_HOST,
  port: dbPort,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
});

export default pool;