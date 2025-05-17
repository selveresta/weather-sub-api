import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WeatherModule } from './weather/weather.module';
import { ConfigModule } from '@nestjs/config';
import { Config } from './config/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './config/typeorm-config.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [Config],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),
    ScheduleModule.forRoot(),
    SubscriptionsModule,
    WeatherModule,
  ],
})
export class AppModule {}
