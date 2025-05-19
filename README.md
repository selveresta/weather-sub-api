## Weather Subscription API (NestJS)

A backend service built with [NestJS](https://nestjs.com/) that lets users subscribe to weather updates for their city. It:

- Exposes a **weather** endpoint to fetch current conditions via WeatherAPI.com
- Manages **email subscriptions**: subscribe, confirm, unsubscribe
- Sends confirmation and update emails using **@nestjs-modules/mailer** + Handlebars templates
- Schedules hourly/daily updates with Nest’s **SchedulerRegistry** & **CronJob**
- Stores all data in PostgreSQL via **TypeORM**, with automatic migrations
- Runs in Docker (Compose) and can be managed by **PM2** in production

You can view the simple React frontend here:
🔗 **[https://weather-sub.shop/](https://weather-sub.shop/)**

---

## Table of Contents

- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Data Model](#data-model)
- [Getting Started](#getting-started)

  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
  - [Docker / Docker Compose](#docker--docker-compose)

- [Subscription Logic](#subscription-logic)
- [Scheduling & Emails](#scheduling--emails)
- [Migrations](#migrations)

---

## Features

- **Current Weather**: `GET /api/weather?city=<name>`
- **Subscribe**: `POST /api/subscribe` (email, city, frequency)
- **Confirm**: `GET /api/confirm/:token`
- **Unsubscribe**: `GET /api/unsubscribe/:token`
- **Email Templates**:

  - `subscription-confirm.hbs` (confirmation link)
  - `weather-update.hbs` (hourly/daily update + unsubscribe link)

- **Scheduler**:

  - Hourly or Daily cron jobs per active subscription
  - Automatically re-registered on server restart

- **Database**: PostgreSQL with TypeORM entities & migrations
- **Configuration**: via `@nestjs/config`; supports `.env`

---

## API Endpoints

### Weather

```http
GET /api/weather?city=Kyiv
```

- **Query**: `city` (string)
- **Response**:

  ```json
  {
    "temperature": 21.3,
    "humidity": 60,
    "description": "Partly cloudy"
  }
  ```

### Subscription

```http
POST /api/subscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "city": "Kyiv",
  "frequency": "hourly"  // or "daily"
}
```

- **Responses**:

  - `200` Confirmation email sent
  - `400` Missing/invalid fields
  - `409` Email already subscribed

```http
GET /api/confirm/:token
```

- Confirms subscription; status moves from **pending** → **active**
- Starts the cron job

```http
GET /api/unsubscribe/:token
```

- Moves status from **active** → **unsubscribed**
- Stops the cron job

---

## Data Model

**Subscription**

| Column              | Type                                      | Notes                  |
| ------------------- | ----------------------------------------- | ---------------------- |
| `id`                | `SERIAL PRIMARY KEY`                      |                        |
| `email`             | `varchar` UNIQUE                          |                        |
| `city`              | `varchar`                                 | city for updates       |
| `frequency`         | `ENUM('hourly','daily')`                  | update interval        |
| `confirm_token`     | `varchar`                                 | for email confirmation |
| `unsubscribe_token` | `varchar`                                 | for email unsubscribe  |
| `status`            | `ENUM('pending','active','unsubscribed')` | subscription state     |
| `created_at`        | `timestamp` DEFAULT now()                 |                        |
| `confirmed_at`      | `timestamp` NULL                          |                        |
| `unsubscribed_at`   | `timestamp` NULL                          |                        |

---

## Getting Started

### Environment Variables

Copy `.env.example` → `.env` and fill in:

```dotenv
# Server
PORT=3001
NODE_ENV=development

# Database (Postgres)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=testuser
DATABASE_PASSWORD=testpass
DATABASE_NAME=weather_test
TYPEORM_LOGGING=true

# WeatherAPI
WEATHER_API_URL=https://api.weatherapi.com/v1
WEATHER_API_KEY=<your key>

# SMTP (for mailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=yourpassword
```

### Running Locally

```bash
# install deps
yarn install

# run migrations
yarn migration:run

# start in dev mode
yarn start:dev
```

### Docker / Docker Compose

```bash
# build & start
docker-compose up --build -d

# view logs
docker-compose logs -f app
```

Your API will be on `http://localhost:3001/api`, Postgres on 5432.


## Subscription Logic

1. **Subscribe** stores a **pending** record + tokens.
2. **Confirmation** (via token) marks **active**, sets `confirmed_at`, and calls `addCronJobFor()`.
3. **Unsubscribe** marks **unsubscribed**, sets `unsubscribed_at`, and calls `removeCronJobFor()`.
4. On every app boot, `onModuleInit()` re-registers cron jobs for all **active** subscriptions.

---

## Scheduling & Emails

- Uses Nest’s **`SchedulerRegistry`** + `cron` package
- Two Handlebars templates in `src/templates`:

  - **subscription-confirm.hbs**: city, frequency, confirmLink
  - **weather-update.hbs**: city, temperature, humidity, description, unsubscribeLink

- Emails sent via **@nestjs-modules/mailer** configured in `AppModule`

---

## Migrations

- Defined under `src/migrations/*.ts`
- Run via `yarn migration:generate`, `yarn migration:run`, `yarn migration:revert`
- In production, migrations are applied automatically by setting `migrationsRun: true` in TypeORM config.

---

Happy coding! 🚀
