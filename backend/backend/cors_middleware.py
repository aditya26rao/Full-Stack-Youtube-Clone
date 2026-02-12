from django.conf import settings
from django.http import HttpResponse


class SimpleCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin")
        allowed = set(getattr(settings, "CORS_ALLOWED_ORIGINS", []))

        if request.method == "OPTIONS" and origin in allowed:
            response = HttpResponse(status=204)
            self._set_cors_headers(response, origin)
            return response

        response = self.get_response(request)
        if origin in allowed:
            self._set_cors_headers(response, origin)
        return response

    @staticmethod
    def _set_cors_headers(response, origin):
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken, Authorization"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Vary"] = "Origin"
