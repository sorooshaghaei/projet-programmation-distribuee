from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def health(_request):
    return JsonResponse({"status": "ok", "service": "event-service"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("", include("events.urls")),
]
