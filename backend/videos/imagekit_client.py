import os
import base64
import httpx
from imagekitio import ImageKit


def get_imagekit_client():
    private_key = os.getenv("IMAGEKIT_PRIVATE_KEY", "").strip().strip('"')
    if not private_key:
        raise RuntimeError("Missing ImageKit configuration: IMAGEKIT_PRIVATE_KEY")

    # Ignore shell/system proxy vars that can break ImageKit API calls in local dev.
    http_client = httpx.Client(trust_env=False)
    return ImageKit(private_key=private_key, http_client=http_client)


def get_optimized_video_url(base_url: str) -> str:
    if "?" in base_url:
        return f"{base_url}&tr=q-50,f-auto"
    return f"{base_url}?tr=q-50,f-auto"


def get_streaming_url(base_url: str) -> str:
    return f"{base_url}/ik-master.m3u8?tr=sr-240_360_480_720-1080"


def get_thumbnail_url(base_url: str, width: int = 480, height: int = 270) -> str:
    # Generate a thumbnail from the very beginning of the video.
    return f"{base_url}/ik-thumbnail.jpg?tr=so-0,w-{width},h-{height}"


def delete_video(file_id: str) -> str:
    client = get_imagekit_client()
    client.files.delete(file_id=file_id)
    return True


# -------------------------
# Upload Video
# -------------------------
def upload_video(file_data: bytes, file_name: str = "video.mp4") -> dict:
    client = get_imagekit_client()

    response = client.files.upload(file=file_data, file_name=file_name, folder="videos")

    return {"file_id": response.file_id, "url": response.url}


# -------------------------
# Upload Thumbnail
# -------------------------
def upload_thumbnail(file_data: bytes, file_name: str = "thumbnail.jpg") -> dict:
    client = get_imagekit_client()

    # if frontend sends base64 string
    if isinstance(file_data, str) and file_data.startswith("data:"):
        base64_data = file_data.split(",", 1)[1]
        image_bytes = base64.b64decode(base64_data)
    else:
        image_bytes = file_data

    response = client.files.upload(
        file=image_bytes, file_name=file_name, folder="thumbnails"
    )

    return {"file_id": response.file_id, "url": response.url}


def upload_profile_photo(file_data: bytes, file_name: str = "profile.jpg") -> dict:
    client = get_imagekit_client()
    response = client.files.upload(file=file_data, file_name=file_name, folder="profiles")
    return {"file_id": response.file_id, "url": response.url}
