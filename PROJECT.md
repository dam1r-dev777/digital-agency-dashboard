# Payment Dashboard — Проектная документация

> Последнее обновление: 2026-06-25

---

## Обзор

Прототип дашборда для digital-агентства. Автоматизирует связывание входящих платежей с проектами и контролирует статусы закрывающих документов (актов).

---

## Стек технологий

| Слой | Технологии |
|------|-----------|
| Backend | FastAPI 0.111, SQLAlchemy 2.0 (async), Alembic, Pydantic v2 |
| Frontend | Next.js 14 (App Router), React 18, TailwindCSS, SWR |
| База данных | PostgreSQL 15 |
| Инфраструктура | Docker, Docker Compose |

---

## Структура проекта

```
c:\mini payment\
├── .env                          # Переменные окружения (БД)
├── docker-compose.yml            # Оркестрация контейнеров
├── PROJECT.md                    # Этот файл
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/             # Файлы миграций (генерируются)
│   └── app/
│       ├── __init__.py
│       ├── main.py               # FastAPI app, CORS, роуты
│       ├── config.py             # Pydantic Settings (читает .env)
│       ├── database.py           # Async engine, сессия, Base
│       ├── models/
│       │   ├── client.py
│       │   ├── project.py
│       │   ├── payment.py
│       │   └── act.py
│       ├── schemas/
│       │   ├── act.py            # ActRead + вычисление статуса
│       │   ├── payment.py
│       │   ├── project.py
│       │   └── dashboard.py
│       ├── routers/
│       │   ├── acts.py           # PATCH /api/v1/acts/{id}/status
│       │   ├── payments.py       # GET  /api/v1/payments
│       │   ├── projects.py       # GET  /api/v1/projects
│       │   └── dashboard.py      # GET  /api/v1/dashboard/summary
│       └── seed.py               # Наполнение БД тестовыми данными
│
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── package.json
    ├── next.config.js            # Proxy-rewrite /api/* → backend
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── globals.css
        ├── components/dashboard/
        │   ├── DashboardClient.tsx   # "use client" — держит состояние фильтров
        │   ├── SummaryWidget.tsx     # 4 карточки метрик (SWR, обновление 30 с)
        │   ├── FilterPanel.tsx       # Дата / проект / статус фильтры
        │   ├── PaymentsTable.tsx     # Таблица + пагинация + optimistic updates
        │   └── ActStatusBadge.tsx    # Бейдж статуса + кнопки смены статуса
        └── lib/
            ├── types.ts
            ├── api.ts
            └── hooks/
                ├── useDashboard.ts
                ├── usePayments.ts
                └── useProjects.ts
```

---

## База данных

### Модели

#### `clients`
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID PK | |
| name | VARCHAR(255) | Название компании |
| inn | VARCHAR(12) UNIQUE | ИНН |
| ogrn | VARCHAR(15) | ОГРН |
| bank_account | VARCHAR(25) | Расчётный счёт |
| contact_person | VARCHAR(255) | Контактное лицо |

#### `projects`
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID PK | |
| client_id | UUID FK→clients | |
| name | VARCHAR(255) | |
| status | ENUM | `active` / `paused` / `completed` |

#### `payments`
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID PK | |
| project_id | UUID FK→projects | |
| client_id | UUID FK→clients | |
| payment_date | DATE | |
| amount | NUMERIC(15,2) | |
| payment_purpose | VARCHAR(500) | Назначение платежа |
| service_stage | VARCHAR(255) | Этап работ |

#### `acts`
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID PK | |
| payment_id | UUID FK→payments UNIQUE | 1:1 с платежом |
| is_sent | BOOL | По умолчанию `false` |
| sent_at | TIMESTAMPTZ | Проставляется автоматически при `is_sent=true` |
| is_signed | BOOL | По умолчанию `false` |
| signed_at | TIMESTAMPTZ | Проставляется автоматически при `is_signed=true` |
| manager_comment | TEXT | |

---

## Бизнес-логика статусов актов

Статус вычисляется динамически в Pydantic `model_validator` при формировании ответа (не хранится в БД).

```
REQUIRES_ATTENTION  — платёж старше 14 дней, а акт не отправлен
                    — ИЛИ акт отправлен, но не подписан более 30 дней

CLOSED              — is_sent=true И is_signed=true

AWAITING_SIGNATURE  — is_sent=true, is_signed=false (и не REQUIRES_ATTENTION)

NOT_SENT            — is_sent=false, is_signed=false (и не REQUIRES_ATTENTION)
```

`payment_date` передаётся в схему через атрибут `act._payment_date = payment.payment_date` перед валидацией.

---

## API-эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/health` | Healthcheck |
| GET | `/api/v1/dashboard/summary` | Агрегированные метрики для виджетов |
| GET | `/api/v1/payments` | Список платежей с вложенными актами |
| GET | `/api/v1/projects` | Список проектов со статистикой |
| PATCH | `/api/v1/acts/{id}/status` | Обновление флагов is_sent / is_signed |

### Параметры GET /api/v1/payments
| Параметр | Тип | Описание |
|----------|-----|----------|
| page | int | Страница (по умолч. 1) |
| size | int | Размер страницы (1–100, по умолч. 20) |
| date_from | date | Фильтр по дате платежа (от) |
| date_to | date | Фильтр по дате платежа (до) |
| project_id | UUID | Фильтр по проекту |
| status | ActStatus | Фильтр по вычисленному статусу акта |

---

## Порты и адреса

| Сервис | Хост (браузер) | Docker-сеть (контейнер→контейнер) |
|--------|---------------|-----------------------------------|
| PostgreSQL | `localhost:5432` | `db:5432` |
| Backend (FastAPI) | `localhost:8001` | `backend:8000` |
| Frontend (Next.js) | `localhost:3000` | `frontend:3000` |

> Порт бэкенда на хосте — **8001** (8000 был занят Windows).  
> Внутри Docker фронтенд проксирует `/api/*` на `http://backend:8000`.

---

## Запуск проекта

### Первый запуск (с нуля)

```bash
cd "c:\mini payment"

# 1. Запуск БД
docker compose up --build -d db

# 2. Запуск бэкенда (подождать ~10 с пока БД пройдёт healthcheck)
docker compose up --build -d backend

# 3. Создать и применить миграцию
docker compose exec backend alembic revision --autogenerate -m "initial"
docker compose exec backend alembic upgrade head

# 4. Заполнить тестовыми данными
docker compose exec backend python -m app.seed

# 5. Запуск фронтенда
docker compose up --build -d frontend
```

### Повторный запуск

```bash
docker compose up -d
```

### Остановка

```bash
docker compose down
# С удалением данных БД:
docker compose down -v
```

---

## Полезные команды

```bash
# Логи
docker compose logs -f backend
docker compose logs -f frontend

# Состояние миграций
docker compose exec backend alembic current
docker compose exec backend alembic history

# Новая миграция после изменений моделей
docker compose exec backend alembic revision --autogenerate -m "описание"
docker compose exec backend alembic upgrade head

# Подключение к БД напрямую
docker compose exec db psql -U payment_user -d payment_db

# Пересобрать без кэша
docker compose build --no-cache backend
docker compose build --no-cache frontend
```

---

## Ссылки в браузере

| URL | Описание |
|-----|----------|
| http://localhost:3000 | Дашборд |
| http://localhost:8001/docs | Swagger UI (FastAPI) |
| http://localhost:8001/redoc | ReDoc |
| http://localhost:8001/health | Healthcheck |

---

## Архитектурные решения

- **Два URL для БД**: `asyncpg` (async engine, рантайм) и `psycopg2` (sync, только Alembic). Alembic не поддерживает async-драйверы.
- **Proxy-rewrite в Next.js**: фронтенд не делает CORS-запросы — браузер обращается к Next.js серверу, тот проксирует на бэкенд внутри Docker-сети.
- **Статус акта в Python, не в SQL**: `REQUIRES_ATTENTION` зависит от `datetime.now()`, что нельзя надёжно материализовать в SQL без триггеров. Вычисляется в `model_validator` при каждом ответе.
- **Optimistic UI**: `ActStatusBadge` немедленно обновляет локальный стейт при клике, отправляет PATCH, откатывается при ошибке.
- **`expire_on_commit=False`**: предотвращает "detached instance" ошибки SQLAlchemy при возврате ORM-объектов после коммита в async-контексте.

---

## Известные ограничения / TODO

- [ ] Фильтрация по статусу в `/payments` работает в Python-цикле после выборки страницы — при большом объёме данных нужна материализованная колонка в БД или CASE WHEN в SQL.
- [ ] Нет аутентификации/авторизации.
- [ ] Нет возможности создавать клиентов, проекты и платежи через UI (только просмотр).
- [ ] Пагинация при фильтрации по статусу может показывать неполные страницы (status-фильтр применяется после SQL LIMIT).
