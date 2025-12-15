from django.contrib import admin
from django.urls import path, include
from hexcoord import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("template/", views.template_page, name="template"),
    path("template/style.css", views.template_css),
    path("template/ops.js", views.template_js),
    path("", include("web.urls")),
]
