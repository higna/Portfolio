import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocalToolProjects1795600000000 implements MigrationInterface {
  name = 'AddLocalToolProjects1795600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" ADD "isLocal" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD "link" character varying`,
    );
    await queryRunner.query(
      `INSERT INTO "projects" ("title", "slug", "description", "techStack", "liveUrl", "githubUrl", "imageUrl", "isFeatured", "order", "isLocal", "link")
       VALUES
         ('PDF Merger', 'pdf-merger', 'Combine multiple PDF files into one document.', ARRAY['PDF', 'Tool', 'Python']::text[], NULL, NULL, NULL, false, 10000, true, '/pdf/merge'),
         ('Image to PDF Converter', 'image-to-pdf', 'Convert multiple images into a single PDF file.', ARRAY['PDF', 'Tool', 'Python']::text[], NULL, NULL, NULL, false, 10001, true, '/pdf/images-to-pdf'),
         ('QR / Barcode Generator', 'barcode-generator', 'Generate QR codes and barcodes for single items.', ARRAY['QR', 'Tool']::text[], NULL, NULL, NULL, false, 10002, true, '/barcode-generator'),
         ('QR / Barcode Interpreter', 'barcode-interpreter', 'Interpret QR codes and barcodes for items.', ARRAY['QR', 'Tool']::text[], NULL, NULL, NULL, false, 10003, true, '/barcode-interpreter')
       ON CONFLICT ("slug") DO UPDATE SET
         "isLocal" = true,
         "link" = EXCLUDED."link"`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "projects" WHERE "slug" IN ('pdf-merger', 'image-to-pdf', 'barcode-generator', 'barcode-interpreter') AND "isLocal" = true`,
    );
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "link"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "isLocal"`);
  }
}
