from django.urls import path

from . import views

app_name = "accounts_api"

urlpatterns = [
    path("csrf/", views.api_csrf, name="csrf"),
    path("register/", views.api_register, name="register"),
    path("login/", views.api_login, name="login"),
    path("logout/", views.api_logout, name="logout"),
    path("me/", views.api_me, name="me"),
    path("settings/", views.api_settings, name="settings"),
    path("settings/update/", views.api_update_settings, name="settings_update"),
]
