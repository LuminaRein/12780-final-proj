import os
import json
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hexcoord.settings")

import django
django.setup()

from django.test import Client
from django.core.exceptions import ValidationError

from web.models import HexPoint, Shape, ShapePoint

# test for cube coordinate validness
@pytest.mark.django_db
def test_hexpoint_cube_constraint_valid():
    hp = HexPoint(q=1, r=-1, s=0)
    hp.clean()
    hp.save()
    assert HexPoint.objects.count() == 1

@pytest.mark.django_db
def test_hexpoint_cube_constraint_invalid():
    hp = HexPoint(q=1, r=1, s=1)
    with pytest.raises(ValidationError):
        hp.clean()

# test for triangles
@pytest.mark.django_db
def test_create_triangle_api():
    c = Client()

    payload = {
        "vertices": [
            {"q": 0, "r": 0, "s": 0},
            {"q": 1, "r": -1, "s": 0},
            {"q": 0, "r": -1, "s": 1},
        ],
        "magnitude": 0,
    }

    resp = c.post(
        "/api/create-triangle/",
        data=json.dumps(payload),
        content_type="application/json",
    )

    assert resp.status_code == 200
    assert Shape.objects.count() == 1

    shape = Shape.objects.first()
    assert shape.shape_type == "triangle"
    assert shape.origin.q == 0
    assert ShapePoint.objects.filter(shape=shape).count() == 3

# test for circles
@pytest.mark.django_db
def test_create_circle_api():
    c = Client()

    payload = {
        "origin": {"q": 0, "r": 0, "s": 0},
        "magnitude": 4,
    }

    resp = c.post(
        "/api/create-circle/",
        data=json.dumps(payload),
        content_type="application/json",
    )

    assert resp.status_code == 200
    shape = Shape.objects.get()
    assert shape.shape_type == "circle"
    assert shape.magnitude == 4

# test for clearing db
@pytest.mark.django_db
def test_clear_db_endpoint():
    c = Client()

    hp = HexPoint.objects.create(q=0, r=0, s=0)
    Shape.objects.create(shape_type="circle", origin=hp, magnitude=1)

    assert Shape.objects.count() == 1

    resp = c.post("/api/clear-db/")
    assert resp.status_code == 200

    assert Shape.objects.count() == 0
    assert HexPoint.objects.count() == 0
