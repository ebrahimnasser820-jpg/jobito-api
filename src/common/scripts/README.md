# Scripts Directory

This directory contains standalone Node.js and shell scripts used for database management, migration, seeding, and testing. These are utilities that fall outside the typical NestJS lifecycle.

## Overview of Scripts

- `check-companies.js`: Displays existing companies in the database.
- `check-db.js`, `check-db-schema.js`, `check-schema.js`: Utility scripts to inspect the database schema and table shapes to ensure the ORM is aligned with PostgreSQL.
- `check-jobs.js`: Displays existing jobs currently stored.
- `cleanup-companies.js`: Deletes duplicate or bad data entries for companies.
- `clear-jobs.js`: Clears all job entries from the DB to reset the state.
- `ensure-image-cols.js`, `fix-images-db.js`: Makes sure any necessary image and media columns exist in the relevant tables (e.g. users or companies).
- `fix-db-schema.js`, `fix-db-final.js`: Alter table scripts to force fix database anomalies and permissions directly via PostgreSQL client rather than TypeORM sync.
- `get-company-id.js`: Helper script to retrieve a specific company's ID by name or email.
- `reset-db.js`: Fully resets/drops specific tables in the database to start fresh.
- `run-cleanup.js`: Runs additional cleanup functions (wrapper).
- `seed.js`: The initial database seed file providing initial categories, tests users, and jobs.
- `test-*.js`: Various small tests (`test-auth.js`, `test-db.js`, `test-users.js`, `test-patch.js`, etc.) to run isolated API tests.

> **Note**: These files were previously located in the root `/jobito-api` folder and have been moved here to maintain a clean project root structure.
