import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

# ASGI middleware to restore the original client path on Vercel
@app.middleware("http")
async def vercel_matched_path_middleware(request, call_next):
    matched_path = request.headers.get("x-matched-path") or request.headers.get("x-vercel-matched-path")
    if matched_path:
        # Strip query string if present in matched_path
        pure_path = matched_path.split("?")[0]
        request.scope["path"] = pure_path
    return await call_next(request)
