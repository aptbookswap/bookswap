from django.urls import path
from . import views 
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Página principal
    path('', views.index, name='index'),

    # Registro de usuario (formulario y API)
    path('registro/', views.registro, name='registro'),
    path('api/registro/', views.api_registro, name='api_registro'),

    # Inicio de sesión API
    path('api/login/', views.login_usuario, name='login_usuario'),

    # Perfil de usuario (vista y API)
    path('perfil/', views.perfil, name='perfil'),
    path('api/perfil/<uuid:uid>/', views.PerfilUsuarioAPIView.as_view(), name='perfil_usuario'),

    # Lista de usuarios y chat
    path('usuarios/', views.user_list, name='user_list'),
    path('chat/<uuid:uid>/', views.chat_view, name='chat'),
    path('chat/<uuid:uid>/fetch/', views.fetch_messages, name='fetch_messages'),

    # Libros (vista, CRUD y API)
    path('libros/', views.libros_view, name='libros'),
    path('libros/crear/', views.crear_libro, name='crear_libro'),
    path('libros/modificar/<uuid:id_libro>/', views.modificar_libro, name='modificar_libro'),
    path('libros/eliminar/<uuid:id_libro>/', views.eliminar_libro, name='eliminar_libro'),
    path('api/libro/<uuid:id_libro>/', views.LibroAPIView.as_view(), name='libro_api'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
