# Database Migrations

This directory contains database migration scripts using Alembic. Migrations allow you to version control your database schema changes and apply them consistently across different environments.

## Migration Files

- `001_enhance_invoice_model.py` - Enhanced invoice model with new fields for supplier, invoice type, currency, and GST calculations

## Running Migrations

### Using the Migration Script (Recommended)

```bash
# Apply all pending migrations
python migrate.py upgrade

# Revert the last migration
python migrate.py downgrade

# Check current migration status
python migrate.py status

# View migration history
python migrate.py history

# Create a new migration (auto-generate from model changes)
python migrate.py revision "Description of changes"
```

### Using Alembic Directly

```bash
# Apply all pending migrations
alembic upgrade head

# Apply specific migration
alembic upgrade 001_enhance_invoice_model

# Revert last migration
alembic downgrade -1

# Check current status
alembic current

# View history
alembic history

# Create new migration
alembic revision --autogenerate -m "Description of changes"
```

## Migration Workflow

1. **Make model changes** in `app/models.py`
2. **Generate migration** using `python migrate.py revision "Description"`
3. **Review the generated migration** in the `migrations/` directory
4. **Apply the migration** using `python migrate.py upgrade`
5. **Test the changes** to ensure they work as expected

## Important Notes

- Always review auto-generated migrations before applying them
- Test migrations in a development environment first
- Keep migrations small and focused on specific changes
- Never modify existing migration files that have been applied to production
- Always backup your database before running migrations in production

## Configuration

The migration system is configured in:
- `alembic.ini` - Main Alembic configuration
- `env.py` - Environment setup and database connection
- `script.py.mako` - Template for generating migration files

## Troubleshooting

If you encounter issues:

1. Check that the database is running and accessible
2. Verify the database URL in `alembic.ini` or environment variables
3. Ensure all required dependencies are installed (`alembic` package)
4. Check the migration history with `python migrate.py history`
5. Review the Alembic logs for detailed error messages
