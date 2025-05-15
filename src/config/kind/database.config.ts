import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'user',
  password: process.env.DATABASE_PASSWORD || 'pass',
  database: process.env.DATABASE_NAME || 'weather',
  synchronize: false,
  migrationsRun: true,
  logging: process.env.TYPEORM_LOGGING === 'true',
}));
