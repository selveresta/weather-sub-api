import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WeatherModule } from './weather/weather.module';
import { WebhookModule } from './webhook/webhook.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [SubscriptionsModule, WeatherModule, WebhookModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
