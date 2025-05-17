import { registerAs } from '@nestjs/config';

export const weatherConfig = registerAs('weather', () => ({
  apiKey: process.env.WEATHER_API_KEY,
  apiUrl: process.env.WEATHER_API_URL,
}));
