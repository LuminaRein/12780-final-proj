from django.db import models
from django.core.exceptions import ValidationError

class HexPoint(models.Model):
    name = models.CharField(max_length=64, blank=True)
    q = models.IntegerField()
    r = models.IntegerField()
    s = models.IntegerField()

    def clean(self):
        if (self.q + self.r + self.s) != 0:
            raise ValidationError("Cube coords sum should be 0.")

    def __str__(self):
        return self.name if self.name else f"({self.q},{self.r},{self.s})"


class Shape(models.Model):
    SHAPE_CHOICES = [
        ("circle", "Circle"),
        ("triangle", "Triangle"),
    ]

    shape_type = models.CharField(max_length=16, choices=SHAPE_CHOICES)
    origin = models.ForeignKey(HexPoint, on_delete=models.CASCADE, related_name="origin_shapes")
    magnitude = models.IntegerField()
    points = models.ManyToManyField(HexPoint, through="ShapePoint", related_name="member_shapes", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.magnitude < 0:
            raise ValidationError("Magnitude must be >= 0.")

    def __str__(self):
        return f"{self.shape_type} origin={self.origin} mag={self.magnitude}"


class ShapePoint(models.Model):
    shape = models.ForeignKey(Shape, on_delete=models.CASCADE)
    point = models.ForeignKey(HexPoint, on_delete=models.CASCADE)
    idx = models.PositiveIntegerField()

    class Meta:
        unique_together = (("shape", "idx"), ("shape", "point"))
        ordering = ["idx"]

    def __str__(self):
        return f"{self.shape_id}:{self.idx}->{self.point_id}"
