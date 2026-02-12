from django.contrib.auth import authenticate, login, logout as auth_logout
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import DatabaseError
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile
from videos.imagekit_client import upload_profile_photo


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def api_csrf(request):
    return Response({"success": True})


@api_view(["POST"])
@permission_classes([AllowAny])
def api_register(request):
    data = request.data
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""

    if not username or not password:
        return Response(
            {"success": False, "error": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if password != confirm_password:
        return Response(
            {"success": False, "error": "Password and confirm password do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"success": False, "error": "Username is already taken."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if email and User.objects.filter(email=email).exists():
        return Response(
            {"success": False, "error": "Email is already in use."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User(username=username, email=email)
    try:
        user.set_password(password)
        user.full_clean(exclude=["password"])
    except ValidationError as exc:
        error_text = "; ".join(exc.messages) if exc.messages else "Invalid input."
        return Response(
            {"success": False, "error": error_text},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.save()
    login(request, user)
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "success": True,
            "user": {"id": user.id, "username": user.username},
            "access_token": str(refresh.access_token),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    data = request.data
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response(
            {"success": False, "error": "Invalid username or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    login(request, user)
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "success": True,
            "user": {"id": user.id, "username": user.username},
            "access_token": str(refresh.access_token),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def api_logout(request):
    auth_logout(request)
    return Response({"success": True})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_me(request):
    user = request.user if request.user.is_authenticated else None
    if not user:
        return Response({"authenticated": False, "user": None})
    profile = _get_or_create_profile(user)

    return Response(
        {
            "authenticated": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "display_name": profile.display_name or user.username,
                "channel_description": profile.channel_description,
                "photo_url": profile.photo_url,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_settings(request):
    user = request.user
    profile = _get_or_create_profile(user)
    return Response(
        {
            "success": True,
            "settings": {
                "username": user.username,
                "email": user.email,
                "display_name": profile.display_name,
                "channel_description": profile.channel_description,
                "photo_url": profile.photo_url,
            },
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_update_settings(request):
    user = request.user
    profile = _get_or_create_profile(user)
    if not hasattr(profile, "save"):
        return Response(
            {"success": False, "error": "Profile table not ready. Run migrations."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    display_name = (request.data.get("display_name") or "").strip()
    channel_description = (request.data.get("channel_description") or "").strip()

    profile.display_name = display_name[:120]
    profile.channel_description = channel_description

    photo_file = request.FILES.get("photo_file")
    if photo_file:
        try:
            upload_result = upload_profile_photo(
                file_data=photo_file.read(),
                file_name=photo_file.name or f"{user.username}_profile.jpg",
            )
            profile.photo_url = upload_result["url"]
        except Exception as exc:
            return Response(
                {"success": False, "error": f"Photo upload failed: {exc}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    profile.save()

    return Response(
        {
            "success": True,
            "settings": {
                "username": user.username,
                "email": user.email,
                "display_name": profile.display_name,
                "channel_description": profile.channel_description,
                "photo_url": profile.photo_url,
            },
        }
    )


def _get_or_create_profile(user):
    try:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile
    except DatabaseError:
        # Safety fallback when migration has not yet been applied.
        class _ProfileFallback:
            display_name = ""
            channel_description = ""
            photo_url = ""

        return _ProfileFallback()
