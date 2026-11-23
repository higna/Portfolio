import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';

loadEnv({ path: ['.env', '../../.env'] });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run database migrations');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  synchronize: false,
  migrationsTableName: 'migrations',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});
