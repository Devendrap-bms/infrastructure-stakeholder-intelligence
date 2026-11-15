# Repository Structure

Current layout (Phase 0). Only folders that exist today are listed.

```text
infrastructure-stakeholder-intelligence/
|-- .env.example              Names and placeholders for environment variables
|-- .gitattributes            Line-ending normalisation (LF)
|-- .gitignore                Ignored files (env files, builds, dependencies)
|-- README.md
|-- biome.json                Biome lint and format configuration
|-- bun.lock
|-- components.json           shadcn/ui configuration
|-- next.config.ts
|-- package.json
|-- tsconfig.json
|-- convex/                   Convex backend
|   |-- _generated/           Written by Convex; do not edit
|   `-- health.ts             Temporary connection test query
|-- docs/
|   |-- PROGRESS.md
|   |-- SETUP_GUIDE.md
|   |-- ENVIRONMENT_VERSIONS.md
|   `-- REPOSITORY_STRUCTURE.md
|-- ml-service/               Python ML service (own virtual environment)
|   |-- .gitignore            Ignores .venv, caches, model files, large data
|   |-- requirements.txt
|   `-- app/
|       `-- main.py           Minimal FastAPI health endpoint
|-- public/
`-- src/
    |-- app/
    |   |-- ConvexClientProvider.tsx
    |   |-- globals.css
    |   |-- layout.tsx
    |   `-- page.tsx          Temporary connection test page
    |-- components/ui/        shadcn/ui components
    `-- lib/utils.ts
```

## Boundaries

- The Next.js app lives in the repository root. The Python service lives only in `ml-service/` with its own virtual environment.
- Next.js never runs model inference itself; it calls the FastAPI service.
- `.env.local`, `ml-service/.venv/`, model weights and large datasets are never committed.

## Temporary files

`convex/health.ts` and `src/app/page.tsx` exist only to verify connections. They will be replaced when real modules and screens are built.

## Planned, not yet created

Folders for tests, scripts and dataset references are added when the first real content needs them.