from datetime import datetime
from app.core.config import settings
from io import BytesIO
from app.services.app_config import get_config_value_from_cache
import boto3
import urllib.parse
from botocore.exceptions import ClientError
from app.core.config import settings  # or wherever your settings are
import asyncio

async def get_s3_client():
    """
    Create and return an S3 client using credentials from settings.
    """
    aws_region = await get_config_value_from_cache("AWS_REGION")
    s3_client = boto3.client("s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=aws_region
    )
    return s3_client

# async def generate_presigned_url(s3_key: str, expires_in: int = 3600) -> str:
#     """
#     Generate a pre-signed URL for accessing an S3 object.
#     """
#     s3_client = await get_s3_client()
#     bucket_name = await get_config_value_from_cache("AWS_BUCKET_NAME")

#     try:
#         presigned_url = s3_client.generate_presigned_url(
#             ClientMethod="get_object",
#             Params={"Bucket": bucket_name, "Key": s3_key},
#             ExpiresIn=expires_in
#         )
#     except ClientError as e:
#         raise RuntimeError(f"Failed to generate pre-signed URL: {e}")

#     return presigned_url


async def generate_presigned_url(s3_key: str, expires_in: int = 36000) -> str:
    """
    Generate a pre-signed URL for accessing an S3 object.
    """
    try:
        s3_client = await get_s3_client()
        bucket_name = await get_config_value_from_cache("AWS_BUCKET_NAME")

        return s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": bucket_name, "Key": s3_key},
            ExpiresIn=expires_in,
            )
    except ClientError as e:
        raise RuntimeError(f"Failed to generate pre-signed URL: {e}")
    

async def get_file_from_s3_url(s3_url: str, s3_client=None) -> BytesIO:
    """
    Download a file from S3 using a public or known S3 URL.
    Returns the file content as a BytesIO object.
    """

    if s3_client is None:
        s3_client = await get_s3_client()

    # Parse bucket name and key from the URL
    parsed_url = urllib.parse.urlparse(s3_url)
    
    if not parsed_url.netloc.endswith("s3.amazonaws.com"):
        raise ValueError("Invalid S3 URL format.")

    # Extract bucket name and key
    bucket_name = parsed_url.netloc.split('.')[0]  # e.g., my-bucket
    s3_key = parsed_url.path.lstrip('/')  # Remove leading slash

    try:
        buffer = BytesIO()
        s3_client.download_fileobj(Bucket=bucket_name, Key=s3_key, Fileobj=buffer)
        buffer.seek(0)  # Reset pointer before returning
        return buffer
    except ClientError as e:
        raise RuntimeError(f"Failed to download file from S3: {e}")


async def upload_to_s3_file(
    file_obj,                 # file-like object (e.g., from request.files['audio'])
    s3_key: str,        
    content_type: str,
    bucket_name: str,
    s3_client=None
) -> str:
    """
    Upload a file-like object to S3 and return a pre-signed URL for access.
    """
    if s3_client is None:
        s3_client = await get_s3_client()

    print(f"Uploading to S3: {s3_key}")

    try:
        s3_client.upload_fileobj(
            Fileobj=file_obj,
            Bucket=bucket_name,
            Key=s3_key,
            ExtraArgs={"ContentType": content_type}
        )
    except ClientError as e:
        raise RuntimeError(f"Failed to upload file to S3: {e}")
    presigned_url = await generate_presigned_url(s3_key)
    return s3_key, presigned_url


