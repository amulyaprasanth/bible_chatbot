import os
import sys
import logging
from datetime import datetime

# --- Function to get today's log directory ---
def get_log_dir(base_dir="logs"):
    today = datetime.now().strftime("%Y-%m-%d")  # folder per day
    path = os.path.join(base_dir, today)
    os.makedirs(path, exist_ok=True)
    return path

# --- Formatter ---
formatter = logging.Formatter(
    fmt="[%(asctime)s] - %(levelname)s - %(filename)s - %(message)s",
    datefmt="%d-%m-%Y %H:%M:%S"
)

# --- File handler with daily folder ---
log_dir = get_log_dir()
log_filepath = os.path.join(log_dir, "app.log")

file_handler = logging.FileHandler(
    log_filepath,
    encoding="utf-8",
    errors="backslashreplace"
)
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.DEBUG)

# --- Stream handler ---
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)
stream_handler.setLevel(logging.INFO)

# --- Logger setup ---
logger = logging.getLogger("bible_chatbot")
logger.setLevel(logging.DEBUG)
logger.addHandler(file_handler)
logger.addHandler(stream_handler)
