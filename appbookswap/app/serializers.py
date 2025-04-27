from rest_framework import serializers
from .models import Usuario, Libro

class UsuarioSerializer(serializers.ModelSerializer):
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
class LibroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Libro
        fields = '__all__'
        extra_kwargs = {
            'id_libro': {'read_only': True},
            'user': {'read_only': True}
        }
