from rest_framework import serializers
from .models import Usuario, Libro, ImagenLibro

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
            'img_perfil'
        ]
        extra_kwargs = {
            'email': {'read_only': True},
        }

class ImagenLibroSerializer(serializers.ModelSerializer):
    imagen = serializers.ImageField(use_url=True)  

    class Meta:
        model = ImagenLibro
        fields = ['imagen']

class LibroSerializer(serializers.ModelSerializer):
    imagenes = ImagenLibroSerializer(many=True, read_only=True)  

    class Meta:
        model = Libro
        fields = '__all__'
        extra_kwargs = {
            'id_libro': {'read_only': True},
            'user': {'read_only': True}
        }
