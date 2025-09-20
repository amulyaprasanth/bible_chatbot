'''
Custom Exception Handling
'''

import sys


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
    def __init__(self, error_message, error_details:sys) -> None:
        super().__init__(error_message) # Passing the error message to parent class to display it later
        self.error_message = error_message_details(error_message, error_details=error_details)

    def __str__(self):
        return self.error_message



