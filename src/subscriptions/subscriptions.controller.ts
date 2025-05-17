import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscription')
@Controller()
export class SubscriptionsController {
  constructor(private readonly subsService: SubscriptionsService) {}

  @Post('subscribe')
  @ApiOperation({
    summary: 'Subscribe to weather updates',
    description:
      'Subscribe an email to receive weather updates for a specific city with chosen frequency.',
    operationId: 'subscribe',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @ApiResponse({
    status: 200,
    description: 'Subscription successful. Confirmation email sent.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already subscribed' })
  async subscribe(@Body() dto: CreateSubscriptionDto): Promise<void> {
    if (!dto.email || !dto.city || !dto.frequency) {
      throw new BadRequestException('Missing required fields');
    }
    await this.subsService.subscribe(dto);
  }

  @Get('confirm/:token')
  @ApiOperation({
    summary: 'Confirm email subscription',
    description:
      'Confirms a subscription using the token sent in the confirmation email.',
    operationId: 'confirmSubscription',
  })
  @ApiParam({
    name: 'token',
    description: 'Confirmation token',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription confirmed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  async confirm(@Param('token') token: string): Promise<void> {
    if (!token) {
      throw new BadRequestException('Invalid token');
    }
    await this.subsService.confirmSubscription(token);
  }

  @Get('unsubscribe/:token')
  @ApiOperation({
    summary: 'Unsubscribe from weather updates',
    description:
      'Unsubscribes an email from weather updates using the token sent in emails.',
    operationId: 'unsubscribe',
  })
  @ApiParam({
    name: 'token',
    description: 'Unsubscribe token',
    required: true,
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  async unsubscribe(@Param('token') token: string): Promise<void> {
    if (!token) {
      throw new BadRequestException('Invalid token');
    }
    await this.subsService.unsubscribe(token);
  }
}
