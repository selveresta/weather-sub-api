import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WeatherModule } from './weather/weather.module';
import { WebhookModule } from './webhook/webhook.module';
import { CommonModule } from './common/common.module';
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
    WebhookModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
