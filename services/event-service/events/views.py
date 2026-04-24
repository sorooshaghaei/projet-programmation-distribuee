from rest_framework import generics
from .models import Category, Event
from .serializers import CategorySerializer, EventSerializer


class EventListCreateView(generics.ListCreateAPIView):
    queryset = Event.objects.select_related("category").all().order_by("start_date")
    serializer_class = EventSerializer


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Event.objects.select_related("category").all()
    serializer_class = EventSerializer


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
