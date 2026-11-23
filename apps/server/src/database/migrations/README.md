# Database migrations

TypeORM schema synchronization is disabled. Make schema changes in migrations and apply them with `npm run migration:run` from the repository root (or `npm run db:run`). The local development command runs pending migrations before starting Nest.

Generate the default `SchemaUpdate` migration against the configured database:

```sh
npm run migration:generate
```

You can provide a more descriptive migration name:

```sh
npm run migration:generate -- DescribeChange
```

Review generated SQL before committing it. Use `npm run migration:show` to see pending migrations and `npm run migration:revert` to roll back the most recently applied migration. Production server startup applies pending migrations before starting the API.

The migration CLI reads `DATABASE_URL` from the process environment, `apps/server/.env`, or the repository root `.env`. Keep credentials out of committed files.
