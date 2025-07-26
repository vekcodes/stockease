from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Admin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_admin = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Admin: {self.user.username}"

    class Meta:
        verbose_name = "Admin"
        verbose_name_plural = "Admins"
