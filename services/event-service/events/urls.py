from django.urls import path
from .views import (
    EventListCreateView,
    EventDetailView,
    CategoryListCreateView,
    CategoryDetailView,
)

urlpatterns = [
    path("events/", EventListCreateView.as_view(), name="event-list-create"),
    path("events/<int:pk>/", EventDetailView.as_view(), name="event-detail"),
    path("events/categories/", CategoryListCreateView.as_view(), name="category-list-create"),
    path("events/categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),
]
