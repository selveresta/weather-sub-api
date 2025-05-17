import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionsTable1747503609062
  implements MigrationInterface
{
  name = 'CreateSubscriptionsTable1747503609062';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_frequency_enum" AS ENUM('hourly', 'daily')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('pending', 'active', 'unsubscribed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "city" character varying NOT NULL, "frequency" "public"."subscriptions_frequency_enum" NOT NULL, "confirm_token" character varying NOT NULL, "unsubscribe_token" character varying NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "confirmed_at" TIMESTAMP, "unsubscribed_at" TIMESTAMP, CONSTRAINT "UQ_f0558bf43d14f66844255e8b7c2" UNIQUE ("email"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscriptions_frequency_enum"`,
    );
  }
}
