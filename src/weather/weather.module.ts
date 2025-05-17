import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WeatherConfig } from '@T/config';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get('config.weather.apiUrl'),
        timeout: 5000,
        params: {
          key: config.get<Pick<WeatherConfig, 'apiKey'>>(
            'config.weather.apiKey',
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [WeatherService],
  exports: [WeatherService],
  controllers: [WeatherController],
})
export class WeatherModule {}
