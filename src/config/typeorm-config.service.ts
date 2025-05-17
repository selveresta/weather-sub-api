import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfig } from '@T/config';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const appConfig = this.configService.get<AppConfig>('config');
    if (!appConfig) {
      throw new Error('App configuration is not defined');
    }
    const dbConfig = appConfig.database;

    return {
      type: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: [],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: dbConfig.synchronize,
      migrationsRun: dbConfig.migrationsRun,
      logging: dbConfig.logging,
    };
  }
}
