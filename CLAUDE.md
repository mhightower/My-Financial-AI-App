# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 financial application with a FastAPI backend. The frontend uses Vite as the build tool and the backend provides REST APIs for financial operations.

## Development Commands

### Frontend (Vue 3)

- **`npm install`** - Install frontend dependencies (run from root directory)
- **`npm run dev`** - Start development server on [localhost:5173](http://localhost:5173) (auto-opens browser)
- **`npm run build`** - Build for production (output in `dist/` directory)
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Lint and auto-fix code style issues

### Backend (FastAPI)

- **`cd backend && python -m venv venv`** - Create Python virtual environment
- **`source venv/bin/activate`** (Linux/Mac) or **`venv\Scripts\activate`** (Windows) - Activate virtual environment
- **`pip install -r requirements.txt`** - Install Python dependencies
- **`python -m uvicorn app.main:app --reload`** - Start development server on [localhost:8000](http://localhost:8000)
- **`python -m uvicorn app.main:app --reload --host 0.0.0.0`** - Run on all interfaces
- **Visit [localhost:8000/docs](http://localhost:8000/docs)** - Interactive API documentation (Swagger UI)

## Project Structure

```
Frontend (Vue 3):
  src/
    main.js            - Vue app entry point, creates root instance
    App.vue            - Root component, main layout
    components/        - Reusable Vue components
  public/              - Static assets served as-is
  index.html           - HTML entry point
  vite.config.js       - Vite configuration
  package.json         - Frontend dependencies

Backend (FastAPI):
  backend/
    app/
      main.py          - FastAPI application and routes
      __init__.py
    requirements.txt   - Python dependencies
    .env.example       - Example environment variables
```

## Architecture Notes

**Vue 3 Setup:**

- Uses Composition API with `<script setup>` syntax for cleaner components
- Vite provides hot module replacement (HMR) for instant updates during development
- Component-based architecture: build UIs by composing reusable `.vue` files

**FastAPI Backend:**

- Provides REST API endpoints for financial operations
- CORS enabled for frontend communication (localhost:5173)
- Automatic interactive documentation at `/docs` endpoint
- Pydantic models for request/response validation

## Getting Started

1. Clone the repo and run `npm install` (frontend)
2. Set up backend: `cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
3. Run frontend: `npm run dev` (from root)
4. Run backend: `python -m uvicorn app.main:app --reload` (from backend directory)
5. Frontend runs on [localhost:5173](http://localhost:5173), backend on [localhost:8000](http://localhost:8000)

## Key Dependencies

**Frontend:**

- **Vue 3.3.x** - Progressive JavaScript framework
- **Vite 4.4.x** - Next generation frontend tooling
- **ESLint** - Code linting with Vue 3 rules

**Backend:**

- **FastAPI 0.104.x** - Modern async web framework
- **Uvicorn 0.24.x** - ASGI server
- **Pydantic 2.5.x** - Data validation
