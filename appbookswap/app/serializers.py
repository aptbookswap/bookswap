from rest_framework import serializers
from .models import (
    Usuario, Libro, ImagenLibro,
    ValoracionAOfertador, ValoracionAComprador,
    Publicacion, ImagenPublicacion
)

#------------------------------------
# Serializador de Usuario
#------------------------------------
class UsuarioSerializer(serializers.ModelSerializer):
    img_perfil = serializers.ImageField(use_url=True, required=False)
    preferencias = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Usuario
        fields = [
            'uid',
            'first_name',
            'email',
            'numero',
            'fecha_nacimiento',
            'preferencias',
            'ubicacion',
            'direccion',
            'img_perfil'
        ]
        extra_kwargs = {
            'email': {'read_only': True},
        }

#------------------------------------
# Serializadores de Libro
#------------------------------------
class ImagenLibroSerializer(serializers.ModelSerializer):
    imagen = serializers.ImageField(use_url=True)

    class Meta:
        model = ImagenLibro
        fields = ['imagen']


class LibroSerializer(serializers.ModelSerializer):
    imagenes = ImagenLibroSerializer(many=True, read_only=True)
    imagen = serializers.ImageField(write_only=True, required=False)  # <-- Agrega esto

    class Meta:
        model = Libro
        fields = '__all__'
        extra_kwargs = {
            'id_libro': {'read_only': True},
            'user': {'read_only': True}
        }

    def update(self, instance, validated_data):
        imagen = validated_data.pop('imagen', None)
        libro = super().update(instance, validated_data)
        if imagen:
            # Opcional: borrar imágenes anteriores (si solo quieres una imagen por libro)
            ImagenLibro.objects.filter(libro=libro).delete()
            ImagenLibro.objects.create(libro=libro, imagen=imagen)
        return libro

#------------------------------------
# Serializadores de Valoraciones
#------------------------------------
class ValoracionAOfertadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValoracionAOfertador
        fields = ['id', 'comprador', 'ofertador', 'puntuacion', 'comentario', 'fecha']
        read_only_fields = ['id', 'fecha']


class ValoracionACompradorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValoracionAComprador
        fields = ['id', 'ofertador', 'comprador', 'puntuacion', 'comentario', 'fecha']
        read_only_fields = ['id', 'fecha']

#------------------------------------
# Serializadores de Publicación
#------------------------------------
class ImagenPublicacionSerializer(serializers.ModelSerializer):
    imagen = serializers.ImageField(use_url=True)

    class Meta:
        model = ImagenPublicacion
        fields = ['imagen']

class PublicacionSerializer(serializers.ModelSerializer):
    imagenes = ImagenPublicacionSerializer(many=True, read_only=True)
    imagen = serializers.ImageField(write_only=True, required=False)  # <-- Agrega esto

    class Meta:
        model = Publicacion
        fields = '__all__'
        extra_kwargs = {
            'id_publicacion': {'read_only': True},
            'fecha_publicacion': {'read_only': True},
            'user_ofertador': {'read_only': True}
        }

    def update(self, instance, validated_data):
        imagen = validated_data.pop('imagen', None)
        publicacion = super().update(instance, validated_data)
        if imagen:
            # Opcional: borrar imágenes anteriores (si solo quieres una imagen por publicación)
            ImagenPublicacion.objects.filter(publicacion=publicacion).delete()
            ImagenPublicacion.objects.create(publicacion=publicacion, imagen=imagen)
        return publicacion
