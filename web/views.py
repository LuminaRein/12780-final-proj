from django.http import HttpResponse
from django.template import loader

def home(request):
    tpl = loader.get_template("home.html")
    return HttpResponse(tpl.render({}, request))
