import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Frequency } from '@T/subscription';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Email address to subscribe' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'City for weather updates' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Frequency of updates',
    enum: Frequency,
  })
  @IsEnum(Frequency)
  frequency: Frequency;
}
