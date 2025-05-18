import { registerAs } from '@nestjs/config';

export const serverConfig = registerAs('server', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  url: process.env.SERVER_URL || 'http://weather-sub.shop/',
}));
