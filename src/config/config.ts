import { registerAs } from '@nestjs/config';
import { databaseConfig } from './kind/database.config';
import { serverConfig } from './kind/server.config';
import { weatherConfig } from './kind/weather.config';

export const Config = registerAs('config', () => ({
  database: {
    ...databaseConfig(),
  },
  server: {
    ...serverConfig(),
  },
  weather: {
    ...weatherConfig(),
  },
}));
