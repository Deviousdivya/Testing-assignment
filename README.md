# Employee Data Portal

A Django + DRF project for browsing, filtering, caching, and exporting a large employee dataset.

## Features

- Department, Position, and Employee schema with indexed search/filter fields.
- Paginated REST API using `select_related()` for foreign-key optimization.
- Search by name, email, and department with date-of-joining range filters.
- CSV, Excel, and PDF export endpoints.
- Redis cache support through Django's cache framework, with local-memory fallback.
- Dynamic frontend table with debounced search, date filters, pagination, and export buttons.
- Bulk seed command for 250,000+ employee rows.

## Setup

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Set the `.env` values in your deployment environment. For MySQL, create the database first:

```sql
CREATE DATABASE employee_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run migrations and seed data:

```bash
python manage.py migrate
python manage.py seed_employees --count 250000 --batch-size 5000
python manage.py runserver
```

For local development without MySQL, leave `DB_ENGINE` unset and Django will use SQLite.

## API

- `GET /api/employees/?page=1&page_size=50`
- `GET /api/employees/?search=it&joined_from=2022-01-01&joined_to=2025-12-31`
- `GET /api/employees/export/csv/`
- `GET /api/employees/export/xlsx/`
- `GET /api/employees/export/pdf/`

The PDF export is capped to the first 1,000 filtered rows to keep the generated document practical. CSV and Excel stream rows from the database using queryset iteration.

## Performance Notes

- Use MySQL in production by setting `DB_ENGINE=mysql` and the `MYSQL_*` variables.
- Use Redis by setting `REDIS_URL`; otherwise local-memory cache is used.
- Employee queries use `select_related('department', 'position')`.
- Fields used by search/filtering such as email, phone number, names, department, position, and joining date are indexed.
- Large inserts use `bulk_create()` in batches.
