import { Sequelize } from 'sequelize';

//example postgres connection string: 'postgres://user:pass@example.com:5432/dbname'
export function createSequelize(connectionString: string): Sequelize {
  return new Sequelize(connectionString);
}
