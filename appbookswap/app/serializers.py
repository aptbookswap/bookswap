from rest_framework import serializers
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'uid',
            'first_name',       # nombre
            'email',
            'numero',
            'anno_nacimiento',
            'preferencias',     # ahora es un string
            'ubicacion',
            'img_perfil'
        ]
        extra_kwargs = {
            'email': {'read_only': True},
        }
