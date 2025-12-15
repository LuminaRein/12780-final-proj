from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "12780-final-proj"
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "web",
]

MIDDLEWARE = [  
    "django.middleware.security.SecurityMiddleware",
]

ROOT_URLCONF = "hexcoord.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    }
]

DATABASES = {}

STATIC_URL = "static/"

STATICFILES_DIRS = [
    BASE_DIR / "12780-final-proj",
]
