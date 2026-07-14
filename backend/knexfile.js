require('dotenv').config();

const connection = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartbiz_pos';

module.exports = {
  development: {
    client: 'pg',
    connection,
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' },
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: connection,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' },
  },
};
