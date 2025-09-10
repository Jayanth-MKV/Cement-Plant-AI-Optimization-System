#!/usr/bin/env python3
import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.api_host, port=settings.api_port, reload=settings.debug, log_level="info" if settings.debug else "warning", access_log=settings.debug)
