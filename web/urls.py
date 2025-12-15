from django.urls import path
from . import views
from .views import home


urlpatterns = [
    path("", home, name="home"),
    path("api/create-circle/", views.create_circle),
    path("api/create-triangle/", views.create_triangle),
    path("api/export-shapes-xlsx/", views.export_shapes_xlsx),
    path("api/clear-db/", views.clear_db),
]