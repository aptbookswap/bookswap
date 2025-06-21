from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail

# Ruta de subida para imágenes de perfil
def upload_to(instance, filename):
    return f'uploads/perfiles/{filename}'

# Modelo de usuario extendido desde AbstractUser
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
    preferencias = models.CharField(  
        max_length=50,
        blank=True,
        default="",
        choices=[
            ('Comedia', 'Comedia'),
            ('Romance', 'Romance'),
            ('Terror', 'Terror'),
            ('Misterio', 'Misterio'),
            ('Finanzas', 'Finanzas'),
            ('Psicologia', 'Psicologia'),
            ('Fantasia', 'Fantasia'),
            ('otro', 'otro'),
        ]
    )
    valoracion_comprador = models.FloatField(null=True, blank=True)  
    valoracion_ofertador = models.FloatField(null=True, blank=True)  
    ubicacion = models.CharField(max_length=100)  
    direccion = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.username

User = get_user_model()

# Modelo de mensaje entre usuarios (MODIFICADO)
class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE) 
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_messages', on_delete=models.CASCADE)  
    content = models.TextField() 
    timestamp = models.DateTimeField(auto_now_add=True)
    conversation_notified = models.BooleanField(default=False)  # Nuevo campo

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['sender', 'recipient', 'conversation_notified'],
                name='unique_conversation_notification',
                condition=models.Q(conversation_notified=True))
        ]

    def __str__(self):
        return f'{self.sender.username} to {self.recipient.username}: {self.content}'

# Señal MODIFICADA para notificación única por conversación
@receiver(post_save, sender=Message)
def notify_new_conversation(sender, instance, created, **kwargs):
    if created and not instance.conversation_notified:
        # Verificar si ya existe notificación para esta combinación de usuarios
        existing_notification = Message.objects.filter(
            sender=instance.sender,
            recipient=instance.recipient,
            conversation_notified=True
        ).exists()
        
        if not existing_notification:
            subject = f"💬 ¡{instance.sender.first_name} quiere contactarte en BookSwap!"
            message = f"""
            Hola {instance.recipient.first_name},
            
            {instance.sender.first_name} Intenta contactarse contigo, revisa tu chat en Bookswap
            
            ¡Gracias por usar BookSwap!
            (No responder este mensaje)
            """
            send_mail(
                subject,
                message.strip(),
                settings.DEFAULT_FROM_EMAIL,
                [instance.recipient.email],
                fail_silently=False,
            )
            instance.conversation_notified = True
            instance.save()

# Modelo de libro ofrecido por el usuario
class Libro(models.Model):
    id_libro = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  
    titulo = models.CharField(max_length=255)  
    autor = models.CharField(max_length=255)  
    estado = models.CharField(  
        max_length=50,
        choices=[
            ('Perfecto', 'Perfecto'),
            ('Con detalles', 'Con detalles'),
            ('Desgastado', 'Desgastado'),
            ('En malas condiciones', 'En malas condiciones')
        ]
    )
    genero = models.CharField(max_length=255, blank=True, default="") 
    paginas = models.PositiveIntegerField()  
    cantidad = models.PositiveIntegerField()  

    def __str__(self):
        return f'{self.titulo} - {self.autor}'

# Modelo de imagen asociada a un libro
class ImagenLibro(models.Model):
    libro = models.ForeignKey(Libro, related_name='imagenes', on_delete=models.CASCADE)  
    imagen = models.ImageField(upload_to='libros/')  

    def __str__(self):
        return f'Imagen de {self.libro.titulo}'

# Modelo tabla valoraciones Comprador
class ValoracionAComprador(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ofertador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='valoraciones_hechas_a_comprador',
        to_field='uid'
    )
    comprador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='valoraciones_recibidas_como_comprador',
        to_field='uid'
    )
    puntuacion = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    comentario = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.ofertador.username} → {self.comprador.username} ({self.puntuacion} ⭐)'

# Modelo tabla valoraciones Ofertador
class ValoracionAOfertador(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    comprador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='valoraciones_hechas',
        to_field='uid'
    )
    ofertador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='valoraciones_recibidas_como_ofertador',
        to_field='uid'
    )
    puntuacion = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    comentario = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.comprador.username} → {self.ofertador.username} ({self.puntuacion} ⭐)'

# Nuevo modelo para publicaciones
class Publicacion(models.Model):
    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('disponible', 'Disponible'),
        ('en_espera', 'En espera'),
        ('en_proceso', 'En proceso'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
        ('pendiente', 'Pendiente'),
    ]

    TRANSACCION_CHOICES = [
        ('venta', 'Venta'),
        ('donacion', 'Donación'),
    ]

    id_publicacion = models.AutoField(primary_key=True)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    fecha_termino = models.DateTimeField(null=True, blank=True)
    ticket_comprador = models.BooleanField(default=False)
    ticket_ofertador = models.BooleanField(default=False)
    
    user_ofertador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='publicaciones_ofertadas',
        to_field='uid'
    )
    libro = models.ForeignKey(
        'Libro',
        on_delete=models.CASCADE,
        related_name='publicaciones'
    )
    user_comprador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='publicaciones_compradas',
        to_field='uid'
    )
    valor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tipo_transaccion = models.CharField(max_length=10, choices=TRANSACCION_CHOICES)
    descripcion = models.TextField()
    estado_publicacion = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='disponible')

    def __str__(self):
        return f"{self.tipo_transaccion.title()} - {self.libro.titulo} ({self.estado_publicacion})"

# Modelo para imágenes de la publicación
class ImagenPublicacion(models.Model):
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, related_name='imagenes')
    imagen = models.ImageField(upload_to='publicaciones/')

    def __str__(self):
        return f"Imagen de publicación {self.publicacion.id_publicacion}"