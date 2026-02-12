from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include

urlpatterns = [
    path("", lambda request: JsonResponse({"status": "ok", "service": "backend-youtube"})),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.api_urls")),
    path("api/videos/", include("videos.api_urls")),
]
