import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';

import { Subscription } from './subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

import { MailerService } from '@nestjs-modules/mailer';
import { WeatherService } from '../weather/weather.service';
import { SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SubscriptionStatus, Frequency } from '@T/subscription';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,

    private readonly mailer: MailerService,
    private readonly weatherService: WeatherService,

    private readonly schedulerRegistry: SchedulerRegistry,

    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    // 1) load all active subscriptions
    const activeSubs = await this.subscriptionRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    // 2) for each one, (re-)create the cron job
    activeSubs.forEach((sub) => this.addCronJobFor(sub));
  }

  async subscribe(dto: CreateSubscriptionDto): Promise<void> {
    const { email, city, frequency } = dto;
    const existing = await this.subscriptionRepo.findOne({ where: { email } });
    if (existing && existing.status !== SubscriptionStatus.UNSUBSCRIBED) {
      throw new ConflictException('Email already subscribed');
    }

    const confirmToken = randomBytes(16).toString('hex');
    const unsubscribeToken = randomBytes(16).toString('hex');

    let sub: Subscription;
    if (existing) {
      // Reuse the old, unsubscribed row — reset its fields:
      existing.city = city;
      existing.frequency = frequency;
      existing.confirmToken = confirmToken;
      existing.unsubscribeToken = unsubscribeToken;
      existing.status = SubscriptionStatus.PENDING;
      existing.confirmedAt = null;
      existing.unsubscribedAt = null;
      sub = existing;
    } else {
      // No existing record at all → create brand new
      sub = this.subscriptionRepo.create({
        email,
        city,
        frequency,
        confirmToken,
        unsubscribeToken,
        status: SubscriptionStatus.PENDING,
      });
    }
    await this.subscriptionRepo.save(sub);

    // побудова посилань
    const baseUrl =
      this.config.get<string>('config.server.url') ??
      `http://localhost:${this.config.get<number>('config.server.port')}`;
    const confirmLink = `${baseUrl}/api/confirm/${confirmToken}`;

    // відправка листа
    await this.mailer.sendMail({
      to: email,
      subject: 'Підтвердіть підписку на погодні оновлення',
      template: 'subscription-confirm', // шаблон: src/templates/subscription-confirm.hbs
      context: {
        city,
        frequency,
        confirmLink,
      },
    });

    // після відправки листа:
    console.log(`➡️ Confirmation link: ${confirmLink}`);
  }

  async confirmSubscription(token: string): Promise<void> {
    const sub = await this.subscriptionRepo.findOne({
      where: { confirmToken: token },
    });
    if (!sub) throw new NotFoundException('Confirmation token not found');
    if (sub.status !== SubscriptionStatus.PENDING) {
      throw new BadRequestException('Subscription already processed');
    }

    sub.status = SubscriptionStatus.ACTIVE;
    sub.confirmedAt = new Date();
    await this.subscriptionRepo.save(sub);

    // запускаємо cron-джоб
    this.addCronJobFor(sub);
  }

  async unsubscribe(token: string): Promise<void> {
    const sub = await this.subscriptionRepo.findOne({
      where: { unsubscribeToken: token },
    });
    if (!sub) throw new NotFoundException('Unsubscribe token not found');
    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is not active');
    }

    sub.status = SubscriptionStatus.UNSUBSCRIBED;
    sub.unsubscribedAt = new Date();
    await this.subscriptionRepo.save(sub);

    // зупиняємо cron-джоб
    this.removeCronJobFor(sub.id);
  }

  /** Створює та стартує CronJob для однієї підписки */
  private addCronJobFor(sub: Subscription) {
    const jobName = this.getJobName(sub.id);
    // якщо вже існує — нічого не робимо
    if (this.schedulerRegistry.doesExist('cron', jobName)) return;

    // обираємо розклад згідно frequency
    const cronTime =
      sub.frequency === Frequency.HOURLY
        ? CronExpression.EVERY_HOUR
        : CronExpression.EVERY_DAY_AT_NOON;

    const job = new CronJob(cronTime, async () => {
      try {
        const forecast = await this.weatherService.fetchWeather(sub.city);
        const baseURL =
          this.config.get<string>('config.server.url') ||
          `http://localhost:${this.config.get<number>('config.server.port')}`;
        const unsubscribeLink = `${baseURL}/api/unsubscribe/${sub.unsubscribeToken}`;

        await this.mailer.sendMail({
          to: sub.email,
          subject: `☁️ Weather update for ${sub.city}`,
          template: 'weather-update',
          context: {
            city: sub.city,
            temperature: forecast.temperature,
            humidity: forecast.humidity,
            description: forecast.description,
            unsubscribeLink,
          },
        });
      } catch (err) {
        // тут можна логувати помилку
        console.error(`Failed to send update to ${sub.email}`, err);
      }
    });

    // додаємо в реєстр і запускаємо
    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
  }

  /** Видаляє CronJob по імені */
  private removeCronJobFor(id: number) {
    const jobName = this.getJobName(id);
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
    }
  }

  private getJobName(id: number) {
    return `subscription-${id}`;
  }
}
