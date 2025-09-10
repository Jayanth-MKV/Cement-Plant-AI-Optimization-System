"""Tiny colored logging helper (simple + quiet)."""

import logging
import os
import sys

COLORS = {
    logging.DEBUG: "\x1b[36m",  # cyan
    logging.INFO: "\x1b[32m",  # green
    logging.WARNING: "\x1b[33m",  # yellow
    logging.ERROR: "\x1b[31m",  # red
    logging.CRITICAL: "\x1b[1;41m",  # bold inverse
}
RESET = "\x1b[0m"


class SimpleColorFormatter(logging.Formatter):
    def __init__(self, fmt, datefmt=None, use_color=True):
        super().__init__(fmt, datefmt)
        self.use_color = use_color

    def format(self, record):
        if self.use_color:
            color = COLORS.get(record.levelno)
            if color:
                original = record.levelname
                record.levelname = f"{color}{original}{RESET}"
                try:
                    return super().format(record)
                finally:
                    record.levelname = original
        return super().format(record)


def setup_logging(debug: bool):
    if logging.getLogger().handlers:
        return
    level = logging.DEBUG if debug else logging.INFO
    use_color = sys.stderr.isatty() and ("NO_COLOR" not in os.environ)
    handler = logging.StreamHandler()
    fmt = "%(asctime)s %(levelname)s %(name)s: %(message)s"
    handler.setFormatter(SimpleColorFormatter(fmt, "%H:%M:%S", use_color))
    handler.setLevel(level)
    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(handler)
    # Silence noisy libs
    for noisy in ("uvicorn", "uvicorn.error", "uvicorn.access", "httpx", "httpcore", "hpack", "hpack.hpack"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
