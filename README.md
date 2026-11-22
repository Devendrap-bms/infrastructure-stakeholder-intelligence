# Knowledge-Driven Stakeholder Analysis and Risk Intelligence for Infrastructure Planning

An AI-assisted decision-support platform for infrastructure planners. It is intended to analyse project documents, process multilingual citizen feedback (English, Telugu and Kannada, including Romanized text), connect concerns to infrastructure knowledge, retrieve historical evidence, analyse mitigation coverage and prioritise concerns for administrators.

It supports decisions. It does not approve or reject projects or declare legal compliance.

## Current status

Phase 0 (environment and repository setup) is in progress. No application modules are implemented yet. See `docs/PROGRESS.md` for what has been verified.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Application backend | Next.js Route Handlers |
| Database and backend platform | Convex |
| ML service | Python, PyTorch, Hugging Face Transformers, FastAPI |
| Models (later phases) | `google-bert/bert-base-multilingual-cased`, `FacebookAI/xlm-roberta-base` |
| Tooling | Bun, Biome, Git, GitHub |

## Quick start

Full instructions are in `docs/SETUP_GUIDE.md`. Exact verified versions are in `docs/ENVIRONMENT_VERSIONS.md`.

Frontend (project root):

```powershell
bun install
bun dev
```

Convex (second terminal, project root):

```powershell
bunx convex dev
```

ML service (third terminal, `ml-service` folder, virtual environment active):

```powershell
python -m uvicorn app.main:app --reload
```

## Documentation

Core documentation:

- `CLAUDE.md`: Development instructions, stack, commands
- `README.md`: This file - project overview and quick start

Phase documentation:

- `docs/IMPLEMENTATION_ROADMAP.md`: Complete phases, MVP scope, dependencies
- `docs/TEAM_TASK_ASSIGNMENTS.md`: Three developers' responsibilities, task breakdown
- `docs/SHARED_CONTRACTS.md`: API contracts, data structures, integration patterns
- `docs/DEVELOPMENT_PROGRESS.md`: Ongoing progress tracking by phase
- `docs/DECISION_LOG.md`: Architectural decisions, unresolved questions, blockers
- `docs/PROGRESS.md`: Phase 0 verification record
- `docs/SETUP_GUIDE.md`: Environment setup for team members
- `docs/ENVIRONMENT_VERSIONS.md`: Verified tool and package versions
- `docs/REPOSITORY_STRUCTURE.md`: Folder layout

## Branches

`main` is reserved for the final integrated application. Work is integrated into `develop` through Pull Requests.