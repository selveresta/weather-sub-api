/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { HttpStatus } from '@nestjs/common';

import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: HttpService,
          useValue: { get: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'config.weather.apiUrl') return 'http://api.test';
              if (key === 'config.weather.apiKey') return 'TEST_KEY';
            }),
          },
        },
      ],
    }).compile();

    service = module.get(WeatherService);
    httpService = module.get(HttpService);
  });

  it('should fetch and map weather data correctly', async () => {
    const mockData = {
      location: { name: 'Kyiv', localtime: '2025-05-17 15:00' },
      current: {
        temp_c: 20,
        humidity: 50,
        condition: { text: 'Sunny', icon: '', code: 1000 },
      },
    };
    const axiosResponse = { data: mockData } as any;

    // spyOn instead of grabbing httpService.get directly
    const getSpy = jest
      .spyOn(httpService, 'get')
      .mockReturnValueOnce(of(axiosResponse));

    const result = await service.fetchWeather('Kyiv');

    expect(getSpy).toHaveBeenCalledWith('/current.json', {
      params: { q: 'Kyiv', aqi: 'no' },
    });
    expect(result).toEqual({
      city: 'Kyiv',
      temperature: 20,
      humidity: 50,
      description: 'Sunny',
      timestamp: new Date('2025-05-17 15:00'),
      raw: mockData,
    });
  });

  it('should throw NOT_FOUND when upstream returns 404', async () => {
    const axiosError: Partial<AxiosError> = {
      response: { status: 404 } as any,
      isAxiosError: true,
    };
    jest
      .spyOn(httpService, 'get')
      .mockReturnValueOnce(throwError(() => axiosError));

    await expect(service.fetchWeather('UnknownCity')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      message: 'City "UnknownCity" not found',
    });
  });

  it('should throw BAD_GATEWAY on generic errors', async () => {
    jest
      .spyOn(httpService, 'get')
      .mockReturnValueOnce(throwError(() => new Error('Network down')));

    await expect(service.fetchWeather('AnyCity')).rejects.toMatchObject({
      status: HttpStatus.BAD_GATEWAY,
      message: 'Weather service error',
    });
  });
});
