# Setup Guide

For team members on Windows 11 using Windows PowerShell. Follow the steps in order and check each result before moving on. This guide describes what was verified on the first developer machine; it has not yet been followed from scratch by a second person (see Known limitations).

## 1. Install required tools

Required: Git, Node.js (LTS), Bun, Python 3.14 from python.org, VS Code. Versions we verified are in `ENVIRONMENT_VERSIONS.md`. Check each one:

```powershell
git --version
node --version
bun --version
python --version
```

## 2. Get the code

```powershell
git clone https://github.com/Devendrap-bms/infrastructure-stakeholder-intelligence.git
cd infrastructure-stakeholder-intelligence
git switch develop
```

The first push to GitHub opens a browser sign-in through Git Credential Manager. Never share passwords or tokens.

## 3. Frontend

```powershell
bun install
```

Bun may report one blocked postinstall script (esbuild). It was not approved and nothing needed it.

Run the checks:

```powershell
bun run lint
bunx tsc --noEmit
```

Start the app, then open http://localhost:3000:

```powershell
bun dev
```

## 4. Convex

Each developer needs access to a Convex development deployment. How the team shares or separates deployments is still undecided (see Known limitations). For the first developer's flow:

```powershell
bunx convex dev
```

This opens a browser login, creates `.env.local` and keeps running. `.env.local` is ignored by Git. Use `.env.example` as the list of variable names. Check the connection:

```powershell
bunx convex run health:ping
```

Expected: `{ message: 'Convex is connected', ok: true }`

## 5. ML service

Use the python.org Python, not Anaconda's. Run from the repository root:

```powershell
cd ml-service
& "C:\Users\<you>\AppData\Local\Programs\Python\Python314\python.exe" -m venv .venv
.\.venv\Scripts\python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cu132
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Check PyTorch and the GPU:

```powershell
.\.venv\Scripts\python.exe -c "import torch; print(torch.__version__, torch.cuda.is_available())"
```

Start the service (activate the environment first):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/health. Leave the environment with `deactivate`.

## Known issue: Smart App Control

On Windows 11 machines with Smart App Control turned On, importing PyTorch failed with `WinError 4551: An Application Control policy has blocked this file`. On the first developer's personal laptop it was resolved by turning Smart App Control Off (Windows Security, App and browser control, Smart App Control settings). Windows Defender stays on. This reduces protection, so only do it on your own device and install software from official sources only.

## Known limitations

- Not yet reproduced by a second team member.
- The Convex deployment sharing model for four developers is undecided.
- `bun run build` (production build) has not been run.
- Convex free-tier limits have not been checked against the current pricing page.
- No models have been downloaded or loaded; `models_loaded` is false.
- Running the PyTorch install without a CUDA GPU has not been tested.