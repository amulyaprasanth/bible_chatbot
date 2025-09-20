from typing import List
from setuptools import setup, find_packages


def parse_requirements(filepath: str) -> List:

    with open(filepath, "r") as f:

        # split the content into lines
        lines = f.read().splitlines()
    
    # convert the lines into a list of requirements
    return [line.strip() for line in lines if not line.startswith("#") and not line.startswith("-")]

setup(name="bible_chatbot",
version="0.1.0",
author="amulyaprasanth",
author_email="amulyaprasanth301@gmail.com",
packages=find_packages(where="src"),
package_dir={"":"src"},
install_requires=parse_requirements("requirements.txt"),
python_requies=">-3.8")    