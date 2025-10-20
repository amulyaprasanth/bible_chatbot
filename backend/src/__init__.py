import sys
import logging
from datetime import datetime

# --- Formatter ---
formatter = logging.Formatter(
    fmt="[%(asctime)s] - %(levelname)s - %(filename)s - %(message)s",
    datefmt="%d-%m-%Y %H:%M:%S"
)

# --- Stream handler only (console output) ---
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)
stream_handler.setLevel(logging.DEBUG)  # log everything to console

# --- Logger setup ---
logger = logging.getLogger("bible_chatbot")
logger.setLevel(logging.DEBUG)
logger.addHandler(stream_handler)

'''
Custom Exception Handling
'''

def error_message_details(error, error_details: sys):
    _, _, exc_tb = error_details.exc_info()
    filename = exc_tb.tb_frame.f_code.co_filename
    error_message = (
        f"Exception occurred in file: {filename} "
        f"at line number: {exc_tb.tb_lineno}. "
        f"Error message: {str(error)}"
    )
    return error_message

class CustomException(Exception):
    def __init__(self, error_message, error_details: sys) -> None:
        super().__init__(error_message)
        self.error_message = error_message_details(
            error_message, error_details=error_details
        )

    def __str__(self):
        return self.error_message
