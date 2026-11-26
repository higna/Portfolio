import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTailoredDocuments1795500000000 implements MigrationInterface {
  name = 'CreateTailoredDocuments1795500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tailored_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "kind" character varying(24) NOT NULL,
        "title" character varying(200) NOT NULL,
        "candidateName" character varying(160) NOT NULL,
        "jobDescription" text NOT NULL,
        "template" character varying(24),
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tailored_documents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tailored_documents_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tailored_documents_user_updated"
      ON "tailored_documents" ("userId", "updatedAt" DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "tailored_documents"');
  }
}
