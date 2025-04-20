from django.contrib import admin
from .models import Usuario

# Registrar el modelo de usuario personalizado
@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('username', 'nombre', 'email', 'numero', 'ubicacion', 'valoracion_comprador', 'valoracion_ofertador')
    search_fields = ('username', 'email', 'ubicacion')
    list_filter = ('ubicacion',)

    def nombre(self, obj):
        return obj.first_name  # Puedes personalizar esto si usas otro campo
