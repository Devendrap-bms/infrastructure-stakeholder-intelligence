# Environment Versions

Recorded 2026-11-15. Every version below was printed by the tool itself on the developer machine, or by the package installer. Nothing here is copied from documentation.

## Machine (developer laptop 1)

| Item | Value |
|---|---|
| OS | Windows 11, NT 10.0.26300.0 |
| Shell | Windows PowerShell 5.1.26100.9818 |
| GPU | NVIDIA GeForce RTX 3050 Laptop GPU, 4096 MiB |
| NVIDIA driver | 621.24 (CUDA driver capability 13.5) |
| RAM / disk | 16 GB / project on a drive with 191 GB free |

## Tools

| Tool | Version |
|---|---|
| Git | 2.55.0.windows.2 |
| Git Credential Manager | 2.8.0 |
| Node.js | v24.18.0 |
| Bun | 1.4.0 |
| Python (python.org install, used for the ML virtual environment) | 3.14.6 |
| VS Code | 1.145.3 |
| winget | v1.29.380 |

## Frontend packages (installed by create-next-app with Bun)

| Package | Version |
|---|---|
| next | 16.4.6 |
| react / react-dom | 19.3.0 |
| tailwindcss | 4.3.3 |
| @tailwindcss/turbopack | 4.3.3 |
| typescript | 5.9.3 |
| @biomejs/biome | 2.4.2 |
| @types/node | 20.19.43 |
| convex | 1.50.0 |

shadcn/ui was initialised with the Base UI library and the Nova preset.

Installer notices, not acted on: TypeScript 7.0.2 and Tailwind 4.3.5 were reported as available. We stay on the installed versions until a compatibility check is done.

## ML service packages (virtual environment `ml-service/.venv`)

| Package | Version |
|---|---|
| torch | 2.15.0+cu132 (official CUDA 13.2 index) |
| fastapi | 0.163.1 |
| uvicorn | 0.54.0 |
| transformers | 5.23.0 |
| numpy | 2.5.4 |
| pydantic | 2.14.3 |
| starlette | 1.10.0 |
| tokenizers | 0.23.3 |
| safetensors | 0.8.0 |
| huggingface-hub | 2.4.0 |

torchvision is deliberately not installed (text models only).