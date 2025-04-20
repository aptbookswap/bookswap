from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

# Imagen de perfil personalizada
def upload_to(instance, filename):
    return f'uploads/perfiles/{filename}'

class Usuario(AbstractUser):
    uid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    img_perfil = models.ImageField(
        upload_to='perfiles/',
        null=True,
        blank=True,
        default='img/perfil.jpg'
    )
    numero = models.CharField(max_length=20, null=True, blank=True)
    anno_nacimiento = models.PositiveIntegerField(null=True, blank=True)
    preferencias = models.CharField(max_length=255, blank=True, null=True)  # Ahora es texto plano
    valoracion_comprador = models.FloatField(null=True, blank=True)
    valoracion_ofertador = models.FloatField(null=True, blank=True)
    ubicacion = models.CharField(max_length=100)

    def __str__(self):
        return self.username
