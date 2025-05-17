import {
  Controller,
  Get,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { WeatherService } from './weather.service';
import { ForecastDto } from './dto/forecast.dto';
import { GetWeatherDto } from './dto/get-weather.dto';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current weather for a city',
    description:
      'Returns the current weather forecast for the specified city using WeatherAPI.com.',
    operationId: 'getWeather',
  })
  @ApiQuery({
    name: 'city',
    type: String,
    description: 'City name for weather forecast',
    required: true,
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Successful operation - current weather forecast returned',
    type: ForecastDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'City not found' })
  async getWeather(@Query() dto: GetWeatherDto): Promise<ForecastDto> {
    const { city } = dto;
    if (!city) {
      throw new BadRequestException('Query parameter "city" is required');
    }

    const forecast = await this.weatherService
      .fetchWeather(city)
      .catch((err) => {
        if (err) {
          throw new NotFoundException(`City "${city}" not found`);
        }
        throw err;
      });

    return {
      temperature: forecast.temperature,
      humidity: forecast.humidity,
      description: forecast.description,
    };
  }
}
