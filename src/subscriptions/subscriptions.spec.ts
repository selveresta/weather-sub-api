/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './subscription.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { WeatherService } from '../weather/weather.service';
import { SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WeatherResponse } from '@T/weather';

// jest.setTimeout at top level
jest.setTimeout(10000);

describe('SubscriptionsService Cron Integration', () => {
  let repo: jest.Mocked<Repository<Subscription>>;
  let mailer: jest.Mocked<MailerService>;
  let weatherService: jest.Mocked<WeatherService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jest.useRealTimers();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn() },
        },
        {
          provide: WeatherService,
          useValue: { fetchWeather: jest.fn() },
        },
        SchedulerRegistry,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'config.server.url') return 'http://localhost:3001';
              if (key === 'config.server.port') return 3001;
            }),
          },
        },
      ],
    }).compile();

    repo = module.get(getRepositoryToken(Subscription));
    mailer = module.get(MailerService);
    weatherService = module.get(WeatherService);
    config = module.get(ConfigService);

    // stable token
    jest
      .spyOn(crypto, 'randomBytes')
      .mockImplementation(() => Buffer.from('tok'));
  });

  it('fires the cron job after confirmation', () => {
    // schedule for 1 second later
    const runTime = new Date(Date.now() + 1000);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (CronExpression as any).EVERY_HOUR = runTime;

    const scheduler = new SchedulerRegistry();
    const service = new SubscriptionsService(
      repo,
      mailer,
      weatherService,
      scheduler,
      config,
    );

    const sub: any = {
      id: 1,
      status: 'pending',
      confirmToken: 'tok',
      unsubscribeToken: 'tok',
      city: 'TestCity',
      email: 'a@b.com',
      frequency: 'hourly',
      save: jest.fn(),
    };
    repo.findOne.mockResolvedValueOnce(sub);
    repo.save.mockResolvedValueOnce(sub);

    const forecast = {
      city: 'TestCity',
      temperature: 5,
      humidity: 10,
      description: 'OK',
      timestamp: new Date(),
      raw: {} as WeatherResponse,
    };
    weatherService.fetchWeather.mockResolvedValue(forecast);

    return new Promise<void>((resolve) => {
      void service.confirmSubscription('tok').then(() => {
        setTimeout(() => {
          expect(mailer.sendMail.mock.calls.length).toBeGreaterThan(0);
          const args = mailer.sendMail.mock.calls[0][0];
          expect(args.context).toMatchObject({
            city: 'TestCity',
            temperature: 5,
            humidity: 10,
            description: 'OK',
            unsubscribeLink: expect.stringContaining('/api/unsubscribe/tok'),
          });
          // cleanup
          service.unsubscribe('tok').catch(() => {});
          resolve();
        }, 1200);
      });
    });
  });
});
