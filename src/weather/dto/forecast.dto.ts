// src/weather/dto/forecast.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ForecastDto {
  @ApiProperty({
    type: Number,
    description: 'Current temperature',
  })
  temperature: number;

  @ApiProperty({
    type: Number,
    description: 'Current humidity percentage',
  })
  humidity: number;

  @ApiProperty({
    type: String,
    description: 'Weather description',
  })
  description: string;
}
