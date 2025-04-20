from rest_framework import serializers
from .models import Usuario, Preferencia

class UsuarioSerializer(serializers.ModelSerializer):
    preferencias = serializers.SlugRelatedField(
        many=True,
        slug_field='nombre',
        queryset=Preferencia.objects.all()
    )

    class Meta:
        model = Usuario
        fields = [
            'uid',
            'first_name',       # nombre
            'email',
            'numero',
            'anno_nacimiento',
            'preferencias',
            'ubicacion',
            'img_perfil'
        ]
        extra_kwargs = {
            'email': {'read_only': True},
        }

    def update(self, instance, validated_data):
        preferencias_data = validated_data.pop('preferencias', None)

        # actualiza preferencias si vienen
        if preferencias_data is not None:
            instance.preferencias.set(preferencias_data)

        return super().update(instance, validated_data)
