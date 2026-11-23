import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds fields expected by the current User entity to older production schemas. */
export class RepairLegacyUserColumns1795445341299 implements MigrationInterface {
  name = 'RepairLegacyUserColumns1795445341299';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_authprovider_enum" AS ENUM ('local', 'google');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM ('USER', 'SUPERADMIN');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "fullName" character varying,
        ADD COLUMN IF NOT EXISTS "picture" character varying,
        ADD COLUMN IF NOT EXISTS "googleId" character varying,
        ADD COLUMN IF NOT EXISTS "authProvider" "users_authprovider_enum" NOT NULL DEFAULT 'local',
        ADD COLUMN IF NOT EXISTS "role" "users_role_enum" NOT NULL DEFAULT 'USER',
        ADD COLUMN IF NOT EXISTS "isVerified" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "verificationToken" character varying,
        ADD COLUMN IF NOT EXISTS "passwordResetToken" character varying,
        ADD COLUMN IF NOT EXISTS "passwordResetExpires" timestamp with time zone,
        ADD COLUMN IF NOT EXISTS "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_googleId_unique"
      ON "users" ("googleId") WHERE "googleId" IS NOT NULL
    `);
  }

  async down(): Promise<void> {
    // This repair migration is intentionally additive to preserve existing user data.
  }
}
