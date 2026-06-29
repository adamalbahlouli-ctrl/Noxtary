# Database — Noxtary

## Stack
- **Supabase** (PostgreSQL + RLS + Storage)

## Migrations (run in order)
| File | Description |
|------|-------------|
| 001_create_tables.sql | Main content table |
| 002_rls_policies.sql  | Row Level Security |
| 003_storage.sql       | Image storage buckets |
| 004_indexes.sql       | Performance indexes |
| 005_seed_data.sql     | Development seed data |

## Column Reference
See `001_create_tables.sql` for the full schema.
