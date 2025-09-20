import os
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO,
                    format="[%(asctime)s] - %(levelname)s - %(message)s", datefmt="%d-%m-%Y %H:%M:%S")

project_name = "bible_chatbot"

list_of_files = [
    "src/__init__.py",
    "src/components/__init__.py",
    "src/components/rag.py",
    "src/exception.py",
    "requirements.txt",
    "main.py",
    "setup.py",
    ".env",
    ".gitignore",
    "Readme.md"
]


for filepath in list_of_files:
    filepath = Path(filepath)
    filedir, filename = os.path.split(filepath)

    if filedir != "":
        os.makedirs(filedir, exist_ok=True)
        logging.info(f"Creating {filedir} for the file {filename}")

    if (not os.path.exists(filepath)) or (os.path.getsize(filepath) == 0):
        with open(filepath, "w") as f:
            # this is left empty on purpose to create empty file
            pass
        logging.info(f"Creating empty file: {filepath}")

    else:
        logging.info(f"{filename} already exists")
