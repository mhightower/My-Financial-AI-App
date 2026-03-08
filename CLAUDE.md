# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 financial application with a simple UI. The project uses Vite as the build tool for fast development and optimized production builds.

## Development Commands

- **`npm install`** - Install dependencies (run this first after cloning)
- **`npm run dev`** - Start development server on http://localhost:5173 (auto-opens browser)
- **`npm run build`** - Build for production (output in `dist/` directory)
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Lint and auto-fix code style issues

## Project Structure

```
src/
  main.js              - Vue app entry point, creates root instance
  App.vue              - Root component, main layout
  components/          - Reusable Vue components
public/                - Static assets served as-is
index.html             - HTML entry point
vite.config.js         - Vite configuration
```

## Architecture Notes

**Vue 3 Setup:**
- Uses Composition API with `<script setup>` syntax for cleaner components
- Vite provides hot module replacement (HMR) for instant updates during development
- Component-based architecture: build UIs by composing reusable `.vue` files

**File Organization:**
- Each `.vue` file contains template, script, and styles together
- Keep related components grouped in `src/components/`
- Global styles can be added to `App.vue` or created separately

## Getting Started

1. Clone the repo and run `npm install`
2. Run `npm run dev` to start the dev server
3. Edit files in `src/` - changes appear instantly in the browser
4. Build with `npm run build` when ready for production

## Key Dependencies

- **Vue 3.3.x** - Progressive JavaScript framework
- **Vite 4.4.x** - Next generation frontend tooling
- **ESLint** - Code linting with Vue 3 rules
