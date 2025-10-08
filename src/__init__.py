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

'''
Custom Exception Handling
'''


def error_message_details(error, error_details: sys):

    # exc_info() - gets the information about the error
    _, _, exc_tb = error_details.exc_info()

    # get the filename from error details
    filename = exc_tb.tb_frame.f_code.co_filename

    error_message = (
        f"Exception occurred in file: {filename} "
        f"at line number: {exc_tb.tb_lineno}. "
        f"Error message: {str(error)}"
    )
    return error_message


class CustomException(Exception):
    def __init__(self, error_message, error_details: sys) -> None:
        # Passing the error message to parent class to display it later
        super().__init__(error_message)
        self.error_message = error_message_details(
            error_message, error_details=error_details)

    def __str__(self):
        return self.error_message
