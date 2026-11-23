import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds the nullable display name used by the current User entity. */
export class AddUserFullName1795434219653 implements MigrationInterface {
  name = 'AddUserFullName1795434219653';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fullName" character varying',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "fullName"',
    );
  }
}
