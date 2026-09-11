# Hackathon Aggregator Backend

A FastAPI-based backend for aggregating hackathons from multiple platforms (Unstop, Devfolio) with personalized recommendations.

## Features

- **Multi-source Scraping**: Aggregates hackathons from Unstop.com and Devfolio.co with dedicated scrapers
- **Personalized Recommendations**: Algorithm-based scoring matching user preferences (tech stack, themes, mode, location, experience level)
- **Flexible Filtering & Sorting**: Full filtering by mode, fee, location, tags, themes, tech stack, dates
- **Background Scheduling**: Automatic periodic scraping via APScheduler
- **Async Database Operations**: PostgreSQL with SQLAlchemy 2.0 async support
- **RESTful API**: Clean, documented API with OpenAPI/Swagger

## Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with asyncpg
- **ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Scraping**: Playwright + BeautifulSoup + httpx
- **Scheduling**: APScheduler
- **Caching**: Redis (optional)
- **Containerization**: Docker + Docker Compose
## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── hackathons.py    # Hackathon CRUD, filtering, recommendations
│   │       │   ├── users.py         # User preferences
│   │       │   └── scrape.py        # Manual scrape triggers
│   │       └── router.py
│   ├── core/
│   │   ├── config.py               # Pydantic settings
│   │   └── database.py             # Database connection management
│   ├── models/
│   │   ├── hackathon.py            # Hackathon model
│   │   └── user_preference.py      # User preference model
│   ├── schemas/
│   │   ├── hackathon.py            # Hackathon Pydantic schemas
│   │   ├── user_preference.py      # User preference schemas
│   │   └── common.py               # Common response schemas
│   ├── scrapers/
│   │   ├── base.py                 # Base scraper class
│   │   ├── unstop.py               # Unstop.com scraper
│   │   └── devfolio.py             # Devfolio.co scraper
│   ├── services/
│   │   ├── hackathon_service.py    # Hackathon DB operations
│   │   ├── user_preference_service.py
│   │   ├── recommendation_service.py
│   │   └── scraper_service.py      # Scraper orchestration
│   ├── schedulers/
│   │   └── scraper_scheduler.py    # Background scraping scheduler
│   └── main.py                     # FastAPI application entry point
├── alembic/                        # Database migrations
├── tests/                          # Test files
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── alembic.ini
└── .env.example
```

## API Endpoints

### Hackathons

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hackathons` | List all hackathons with filtering, sorting, pagination |
| GET | `/api/hackathons/recommended` | Get personalized recommendations |
| GET | `/api/hackathons/stats` | Get hackathon statistics |
| GET | `/api/hackathons/{id}` | Get single hackathon by ID |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/preferences` | Create/update user preferences |
| GET | `/api/users/preferences/{user_id}` | Get user preferences |
| PATCH | `/api/users/preferences/{user_id}` | Update user preferences |
| DELETE | `/api/users/preferences/{user_id}` | Delete user preferences |

### Scraping (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scrape/trigger` | Trigger scrape for all/specific sources |
| POST | `/api/scrape/trigger/{source}` | Trigger scrape for specific source |
| GET | `/api/scrape/status` | Get scraping status and stats |
## Query Parameters for `/api/hackathons`

| Parameter | Type | Description |
|-----------|------|-------------|
| `mode` | string | Filter by mode: Online, Offline, Hybrid |
| `fee_type` | string | Filter by fee: Free, Paid |
| `state_location` | string | Filter by state/location |
| `country` | string | Filter by country |
| `city` | string | Filter by city |
| `platform_source` | string | Filter by source: unstop.com, devfolio.co |
| `tags` | string | Comma-separated tags |
| `themes` | string | Comma-separated themes |
| `tech_stack` | string | Comma-separated tech stack |
| `search` | string | Search in title/organization |
| `is_active` | boolean | Filter by active status |
| `registration_open` | boolean | Filter by open registration |
| `min_prize_pool` | integer | Minimum prize pool |
| `start_date_from` | ISO date | Event start date from |
| `start_date_to` | ISO date | Event start date to |
| `sort_by` | string | Sort field (registration_deadline, event_start_date, title, prize_pool, created_at, scraped_at) |
| `sort_order` | string | Sort order: asc, desc |
| `page` | integer | Page number (default: 1) |
| `page_size` | integer | Items per page (default: 20, max: 100) |

## Setup Instructions

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis 7+ (optional)

### Local Development

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install Playwright browsers:**
   ```bash
   playwright install chromium
   playwright install-deps chromium
   ```

5. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other settings
   ```

6. **Start PostgreSQL and Redis (using Docker):**
   ```bash
   docker-compose up -d postgres redis
   ```

7. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

8. **Start the development server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

9. **Access API docs:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Using Docker Compose (Full Stack)

```bash
docker-compose up -d --build
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 8000
- pgAdmin on port 5050 (with `--profile admin`)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT secret key | Required |
| `DEBUG` | Enable debug mode | `true` |
| `PORT` | Server port | `8000` |
| `SCRAPER_DELAY_MIN` | Min delay between requests (seconds) | `2` |
| `SCRAPER_DELAY_MAX` | Max delay between requests (seconds) | `5` |
| `SCHEDULER_SCRAPE_INTERVAL_HOURS` | Scrape interval in hours | `6` |

## Scraping Details

### Unstop.com
- Uses their public API endpoint: `/api/public/opportunity/search`
- Extracts: title, description, dates, mode, venue, tags, themes, tech stack, prizes, organization

### Devfolio.co
- Uses their API endpoints: `/api/hackathons`, `/api/search/hackathons`
- Also scrapes webpage for additional hackathons
- Extracts: title, description, dates, mode, location, tags, themes, tech stack, prizes, organizer

## Recommendation Algorithm

The recommendation engine scores hackathons based on user preferences:

| Factor | Weight | Description |
|--------|--------|-------------|
| Tech Stack Match | 3.0 | Matching preferred technologies |
| Theme Match | 2.0 | Matching preferred themes |
| Mode Match | 2.0 | Matching preferred mode (Online/Offline/Hybrid) |
| Location Match | 1.5 | Matching preferred states/countries |
| Experience Level | 1.0 | Beginner/Intermediate/Advanced keywords |
| Prize Pool | 1.0 | Meeting minimum prize threshold |
| Fee Type | 1.0 | Free vs Paid preference |
| Online/Offline Exclusion | 2.0 | Hard filters for excluded modes |

Scores are normalized to 0-100 scale.

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

## License

MIT