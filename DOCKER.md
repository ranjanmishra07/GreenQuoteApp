# Docker Setup for GreenQuote Database

This setup only runs PostgreSQL database using Docker.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Start PostgreSQL Database

```bash
# Start the database
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f postgres
```

### Stop Database

```bash
# Stop the database
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

## Database Connection

- **Host**: localhost
- **Port**: 5432
- **Database**: greenquote
- **Username**: postgres
- **Password**: password

## Access Database

```bash
# Connect to database shell
docker-compose exec postgres psql -U postgres -d greenquote

# Create backup
docker-compose exec postgres pg_dump -U postgres greenquote > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres -d greenquote < backup.sql
```

## Environment Variables

The database is configured with these default values:
- `POSTGRES_DB=greenquote`
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=password`

## Data Persistence

Database data is persisted in a Docker volume named `postgres_data`. This means your data will survive container restarts and updates.

## Initialization

The database is automatically initialized with:
- Users and quotes tables
- Indexes for performance
- Default admin user (admin@greenquote.com / admin123)
- Triggers for automatic timestamp updates
