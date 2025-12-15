from pathlib import Path
from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render

def template_page(request):
    return render(request, "template.html")

def _template_asset_path(filename: str) -> Path:
    return Path(settings.BASE_DIR) / "hexcoord" / "templates" / filename

def template_css(request):
    p = _template_asset_path("style.css")
    if not p.exists():
        return HttpResponseNotFound("style.css not found")
    return HttpResponse(p.read_text(encoding="utf-8"), content_type="text/css; charset=utf-8")

def template_js(request):
    p = _template_asset_path("ops.js")
    if not p.exists():
        return HttpResponseNotFound("ops.js not found")
    return HttpResponse(p.read_text(encoding="utf-8"), content_type="application/javascript; charset=utf-8")
