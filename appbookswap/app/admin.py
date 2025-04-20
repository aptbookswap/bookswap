from django.contrib import admin
from .models import (
    Usuario,
    Preferencia,
    Libro,
    Publicacion,
    ImagenPublicacion,
    Valoracion
)

# Registrar el modelo de usuario personalizado
@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('username', 'nombre', 'email', 'numero', 'ubicacion', 'valoracion_comprador', 'valoracion_ofertador')
    search_fields = ('username', 'email', 'ubicacion')
    list_filter = ('ubicacion',)
    filter_horizontal = ('preferencias',)

    def nombre(self, obj):
        return obj.first_name  # Puedes personalizar esto si usas otro campo

@admin.register(Preferencia)
class PreferenciaAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(Libro)
class LibroAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'autor', 'estado', 'usuario', 'genero', 'cantidad')
    search_fields = ('titulo', 'autor')
    list_filter = ('genero', 'estado')

@admin.register(Publicacion)
class PublicacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'libro', 'ofertador', 'comprador', 'valor', 'tipo_transaccion', 'estado')
    search_fields = ('libro__titulo', 'descripcion')
    list_filter = ('tipo_transaccion', 'estado', 'ubicacion')

@admin.register(ImagenPublicacion)
class ImagenPublicacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'publicacion', 'imagen')

@admin.register(Valoracion)
class ValoracionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'valoracion', 'tipo_valoracion', 'comentario')
    list_filter = ('tipo_valoracion', 'valoracion')
    search_fields = ('usuario__username', 'comentario')


