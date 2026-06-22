// Here we define the database connection using mysql2 package
import { createPool } from "mysql2/promise";

// Define ports with fallbacks
const parsedPort = Number.parseInt(process.env.DB_PORT ?? "", 10);
const dbPort = Number.isInteger(parsedPort) ? parsedPort : 3306;

// Define the connection pool
const pool = createPool({
  host: process.env.DB_HOST,
  port: dbPort,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
});

export default pool;
