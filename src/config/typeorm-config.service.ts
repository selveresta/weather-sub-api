import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfig } from '@T/config';
import { Subscription } from '../subscriptions/subscription.entity';
import { join } from 'path';

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
      entities: [Subscription],
      migrations: [join(__dirname, '..', 'migrations', '*.js')],
      migrationsTableName: 'migrations',
      synchronize: dbConfig.synchronize,
      migrationsRun: dbConfig.migrationsRun,
      logging: dbConfig.logging,
    };
  }
}
