from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
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
    fecha_nacimiento = models.DateField(null=True, blank=True)
    preferencias = models.CharField(max_length=255, blank=True, null=True)  # Ahora es texto plano
    valoracion_comprador = models.FloatField(null=True, blank=True)
    valoracion_ofertador = models.FloatField(null=True, blank=True)
    ubicacion = models.CharField(max_length=100)

    def __str__(self):
        return self.username

User = get_user_model()

class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.sender.username} to {self.recipient.username}: {self.content}'


class Libro(models.Model):
    id_libro = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=255)
    autor = models.CharField(max_length=255)
    estado = models.CharField(max_length=50, choices=[
        ('Perfecto', 'Perfecto'),
        ('Con detalles', 'Con detalles'),
        ('Desgastado', 'Desgastado'),
        ('En malas condiciones', 'En malas condiciones')
    ])
    genero = models.CharField(max_length=100)
    paginas = models.PositiveIntegerField()
    cantidad = models.PositiveIntegerField()
    
    def __str__(self):
        return f'{self.titulo} - {self.autor}'

class ImagenLibro(models.Model):
    libro = models.ForeignKey(Libro, related_name='imagenes', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='libros/')

    def __str__(self):
        return f'Imagen de {self.libro.titulo}'