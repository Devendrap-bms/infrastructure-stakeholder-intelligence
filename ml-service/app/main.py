"""Minimal ML service for Phase 0.

This only proves that FastAPI runs and reports the real state of the
environment. No models are loaded and no predictions are made here.
Model loading and inference are implemented in Phase 3.
"""

import platform

import torch
from fastapi import FastAPI

app = FastAPI(title="Infrastructure Stakeholder Intelligence ML Service")


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "ml-service",
        "python": platform.python_version(),
        "torch": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "models_loaded": False,
    }