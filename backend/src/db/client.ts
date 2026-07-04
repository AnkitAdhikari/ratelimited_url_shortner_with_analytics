import { Sequelize } from 'sequelize';
import { loadEnv } from '../config/env.js';
try {
  process.loadEnvFile();
} catch {
  // No .env file — fall back to the ambient environment.
}

export const env = loadEnv();

//example postgres connection string: 'postgres://user:pass@example.com:5432/dbname'
function createSequelize(connectionString: string): Sequelize {
  return new Sequelize(connectionString, {
    logging: console.log,
  });
}

export const sequelize = createSequelize(env.DATABASE_URL);
