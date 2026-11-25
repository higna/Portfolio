import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1795434219652 implements MigrationInterface {
  name = 'InitialSchema1795434219652';

  async up(queryRunner: QueryRunner): Promise<void> {
    const [{ usersExists }] = await queryRunner.query(
      `SELECT to_regclass('public.users') IS NOT NULL AS "usersExists"`,
    );
    if (usersExists) return;

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_authprovider_enum" AS ENUM('local', 'google')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'SUPERADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying, "fullName" character varying, "picture" character varying, "googleId" character varying, "authProvider" "public"."users_authprovider_enum" NOT NULL DEFAULT 'local', "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "isVerified" boolean NOT NULL DEFAULT false, "verificationToken" character varying, "passwordResetToken" character varying, "passwordResetExpires" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "campaign_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "flyerUrl" text NOT NULL, "photoBox" jsonb NOT NULL, "nameConfig" jsonb NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ca50726582efebc779f5cccd389" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "generator_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "settings" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_565370aea4d5ee07594c0190278" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "userMessage" text NOT NULL, "aiResponse" text NOT NULL, "conversationId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cf76a7693b0b075dd86ea05f21d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "certifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "issuer" character varying NOT NULL, "date" date NOT NULL, "url" character varying, "order" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fd763d412e4a1fb1b6dadd6e72b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_role_enum" AS ENUM('USER', 'SUPERADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('info', 'success', 'warning', 'error')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "role" "public"."notifications_role_enum", "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'info', "title" character varying NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "experiences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "jobTitle" character varying NOT NULL, "company" character varying NOT NULL, "description" jsonb NOT NULL DEFAULT '[]', "startDate" date NOT NULL, "endDate" date, "isCurrent" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_884f0913a63882712ea578e7c85" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "educations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "degree" character varying NOT NULL, "institution" character varying NOT NULL, "startDate" date NOT NULL, "endDate" date, "grade" character varying, "order" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_09d2f29e7f6f31f5c01d79d2dbf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying NOT NULL, "phone" character varying, "linkedinUrl" character varying, "githubUrl" character varying, "portfolioUrl" character varying, "professionalSummary" text, "languages" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "REL_315ecd98bd1a42dcf2ec4e2e98" UNIQUE ("userId"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "slug" character varying NOT NULL, "description" text NOT NULL, "techStack" text array NOT NULL DEFAULT '{}', "liveUrl" character varying, "githubUrl" character varying, "imageUrl" character varying, "isFeatured" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_96e045ab8b0271e5f5a91eae1ee" UNIQUE ("slug"), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "category" character varying NOT NULL, "proficiency" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_templates" ADD CONSTRAINT "FK_9429eef3f65e03ec91a348de85f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "generator_settings" ADD CONSTRAINT "FK_f93aaf44616b08e805e2025ab19" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_history" ADD CONSTRAINT "FK_6bac64204c7b416f465e17957ed" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  async down(): Promise<void> {
    // Keep the baseline non-destructive; use a disposable database to recreate it.
  }
}
