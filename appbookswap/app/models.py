from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

# Opcional: para manejar imágenes
def upload_to(instance, filename):
    return f'uploads/{instance.__class__.__name__.lower()}/{filename}'

# Modelo personalizado de usuario
class Usuario(AbstractUser):
    uid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    img_perfil = models.ImageField(
    upload_to='perfiles/',
    null=True,
    blank=True,
    default='img/perfil.jpg'  # ruta relativa a MEDIA_URL
)


    numero = models.CharField(max_length=20, null=True, blank=True)
    anno_nacimiento = models.PositiveIntegerField(null=True, blank=True)
    preferencias = models.ManyToManyField('Preferencia', blank=True)
    valoracion_comprador = models.FloatField(null=True, blank=True)
    valoracion_ofertador = models.FloatField(null=True, blank=True)
    ubicacion = models.CharField(max_length=100)

    def __str__(self):
        return self.username

# Modelo para representar categorías o gustos
class Preferencia(models.Model):
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre

# Modelo de valoración entre usuarios
class Valoracion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='valoraciones_recibidas')
    valoracion = models.PositiveSmallIntegerField()  # 1-5
    tipo_valoracion = models.CharField(max_length=20)  # Ej: "comprador" o "ofertador"
    comentario = models.TextField()

    def __str__(self):
        return f'{self.usuario.username} - {self.valoracion}'

# Modelo de libro ofrecido
class Libro(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='libros')
    titulo = models.CharField(max_length=100)
    autor = models.CharField(max_length=100)
    estado = models.CharField(max_length=50)
    genero = models.CharField(max_length=50)
    paginas = models.PositiveIntegerField()
    cantidad = models.PositiveIntegerField()

    def __str__(self):
        return self.titulo

# Modelo de publicación de un libro
class Publicacion(models.Model):
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    fecha_termino = models.DateTimeField()
    ubicacion = models.CharField(max_length=100)
    comprador = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='publicaciones_compradas')
    ofertador = models.ForeignKey(Usuario, on_delete=models.CASCADE, null=True, related_name='publicaciones_ofrecidas')
    libro = models.ForeignKey(Libro, on_delete=models.CASCADE)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    tipo_transaccion = models.CharField(max_length=50)  # Ej: venta, intercambio, donación
    descripcion = models.TextField()
    estado = models.CharField(max_length=50)

    def __str__(self):
        return f'{self.libro.titulo} - {self.tipo_transaccion}'

# Imágenes asociadas a una publicación
class ImagenPublicacion(models.Model):
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, related_name='imagenes')
    imagen = models.ImageField(upload_to=upload_to)

    def __str__(self):
        return f'Imagen de {self.publicacion.id}'

