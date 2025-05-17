/**
 * Конфігурація підключення до БД
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  migrationsRun: boolean;
  logging: boolean;
}

/**
 * Налаштування сервера
 */
export interface ServerConfig {
  port: number;
  environment: string;
  logLevel: string;
}

/**
 * Налаштування зовнішньої Weather API
 */
export interface WeatherConfig {
  apiKey: string;
  apiUrl: string;
}

/**
 * Загальна структура конфігурації додатку
 */
export interface AppConfig {
  database: DatabaseConfig;
  server: ServerConfig;
  weather: WeatherConfig;
}
