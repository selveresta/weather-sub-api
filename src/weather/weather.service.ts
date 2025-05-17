import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Forecast, WeatherResponse } from '@T/weather';
import axios, { AxiosError } from 'axios';

@Injectable()
export class WeatherService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly current: string = '/current.json';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const weatherConfig = this.configService.get<{
      apiKey: string;
      apiUrl: string;
    }>('config.weather');
    if (!weatherConfig?.apiKey || !weatherConfig?.apiUrl) {
      throw new Error('Weather API configuration is not defined');
    }
    this.apiKey = weatherConfig.apiKey;
    this.apiUrl = weatherConfig.apiUrl;
  }

  async fetchWeather(city: string): Promise<Forecast> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<WeatherResponse>(this.current, {
          params: { q: city, aqi: 'no' },
        }),
      );

      const data = response.data;

      const forecast: Forecast = {
        city: data.location.name,
        temperature: data.current.temp_c,
        humidity: data.current.humidity,
        description: data.current.condition.text,
        timestamp: new Date(data.location.localtime),
        raw: data,
      };

      return forecast;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          throw new HttpException(
            `City "${city}" not found`,
            HttpStatus.NOT_FOUND,
          );
        }
      }
      throw new HttpException('Weather service error', HttpStatus.BAD_GATEWAY);
    }
  }
}
