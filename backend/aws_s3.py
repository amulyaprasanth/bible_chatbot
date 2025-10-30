import logging
import os
from urllib.parse import urlparse

import boto3
import requests
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()


class S3Client:
    def __init__(self):
        self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=os.getenv("AWS_REGION"),
        )

        self.bucket_name = os.getenv("AWS_S3_BUCKET_NAME")

    def upload_file(self, image_url: str, object_name=None):
        """Upload a file to an S3 bucket

        :param image_url: URL to an image to upload
        :param object_name: S3 object name. If not specified then file_name is used
        :return: True if file was uploaded, else False
        """

        try:
            headers = {
                    "User-Agent": (
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                            "AppleWebKit/537.36 (KHTML, like Gecko) "
                            "Chrome/115.0.0.0 Safari/537.36"
                    )
            }
            response = requests.get(image_url, stream=True, headers=headers, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logging.error(f"❌ Failed to download image from {image_url}: {e}")
            return False

        # Get a default filename if not provided
        if object_name is None:
            object_name = os.path.basename(urlparse(image_url).path)

        # Upload the file
        try:
            response = self.s3_client.upload_fileobj(
                    response.raw, self.bucket_name, object_name,
                    ExtraArgs={"ACL": "public-read", "ContentType": "image/jpeg"},

            )
            print(response)
            logging.info("File uploaded to S3 successfully")
        except ClientError as e:
            logging.error(e)
            return False
        return True

    def create_url(self, object_name: str):
        """Generate a URL for the object to share"""
        try:
            response = self.s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.bucket_name, "Key": object_name},
            )
            print(response)
        except ClientError as e:
            logging.error(e)


if __name__ == "__main__":
    s3_client = S3Client()
    s3_client.upload_file(
            "https://upload.wikimedia.org/wikipedia/commons/b/b6/Image_created_with_a_mobile_phone.png",
            "demo_image"
    )
    s3_client.create_url("demo_image")
