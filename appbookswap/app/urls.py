from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from . import views
from .views import (
    valorar_ofertador, valorar_comprador, detalle_publicacion_view, publicacion_detalle,
    aceptar_publicacion, confirmar_en_proceso, volver_a_disponible, marcar_completado,
    detalle_publicacion_estado_view, Publicar, publicaciones_comprador_view,
    marcar_ticket_completado, CustomPasswordResetConfirmView, catalogo_publicaciones_ajax, detalle_publicacion_catalogo,api_logout
)

urlpatterns = [
    # Página principal
    path('', views.index, name='index'),

    # Registro y autenticación
    path('registro/', views.registro, name='registro'),
    path('api/registro/', views.api_registro, name='api_registro'),
    path('api/login/', views.login_usuario, name='login_usuario'),
    path('api/logout/', api_logout, name='api_logout'),

    # Perfil de usuario
    path('perfil/', views.perfil, name='perfil'),
    path('api/perfil/<uuid:uid>/', views.PerfilUsuarioAPIView.as_view(), name='perfil_usuario'),

    # Usuarios y chat
    path('usuarios/', views.user_list, name='user_list'),
    path('chat/<uuid:uid>/', views.chat_view, name='chat'),
    path('chat/<uuid:uid>/fetch/', views.fetch_messages, name='fetch_messages'),

    # Libros
    path('libros/', views.libros_view, name='libros'),
    path('libros/crear/', views.crear_libro, name='crear_libro'),
    path('libros/modificar/<uuid:id_libro>/', views.modificar_libro, name='modificar_libro'),
    path('libros/eliminar/<uuid:id_libro>/', views.eliminar_libro, name='eliminar_libro'),
    path('api/libro/<uuid:id_libro>/', views.LibroAPIView.as_view(), name='libro_api'),

    # Publicaciones
    path('publicaciones/', views.publicaciones_view, name='publicaciones'),
    path('publicaciones/crear/', views.crear_publicacion_view, name='crear_publicacion'),
    path('api/publicaciones/', views.crear_publicacion, name='api_crear_publicacion'),
    path('publicaciones/<int:id_publicacion>/', detalle_publicacion_view, name='detalle_publicacion'),
    path('publicaciones/estado/<int:id_publicacion>/', detalle_publicacion_estado_view, name='detalle_publicacion_estado'),
    path('publicaciones/usuario/<uuid:uid>/', views.publicaciones_usuario_view, name='publicaciones_usuario'),
    path('publicaciones_comprador/', publicaciones_comprador_view, name='publicaciones_comprador'),

    # API de publicaciones (acciones)
    path('api/publicacion/<int:id_publicacion>/', publicacion_detalle, name='publicacion_detalle'),
    path('api/publicacion/<int:publicacion_id>/aceptar/', aceptar_publicacion, name='aceptar_publicacion'),
    path('api/publicacion/<int:publicacion_id>/confirmar-en-proceso/', confirmar_en_proceso, name='confirmar_en_proceso'),
    path('api/publicacion/<int:publicacion_id>/cancelar/', views.cancelar_publicacion, name='cancelar_publicacion'),
    path('api/publicacion/<int:publicacion_id>/volver-a-disponible/', volver_a_disponible, name='volver_a_disponible'),
    path('api/publicacion/<int:publicacion_id>/marcar-completado/', marcar_completado, name='marcar_completado'),
    path('api/publicacion/<int:publicacion_id>/Publicar/', Publicar, name='Publicar'),
    path('api/publicacion/<int:id_publicacion>/marcar-completado/', marcar_ticket_completado, name='marcar_completado'),

    # Valoraciones
    path('api/valorar/ofertador/', valorar_ofertador, name='valorar_ofertador'),
    path('api/valorar/comprador/', valorar_comprador, name='valorar_comprador'),

    # Recuperación de contraseña
    path('password_reset/', auth_views.PasswordResetView.as_view(
        template_name='password_reset/form.html',
        html_email_template_name='password_reset/email.html',
        email_template_name='password_reset/email.html',
        subject_template_name='password_reset/subject.txt',
        success_url='/password_reset/done/'
    ), name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='password_reset/done.html'
    ), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', CustomPasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(
        template_name='password_reset/complete.html'
    ), name='password_reset_complete'),


    #Catalogo de publicaciones
    path('catalogo/ajax/', catalogo_publicaciones_ajax, name='catalogo_publicaciones_ajax'),
    path('catalogo/publicacion/<int:id_publicacion>/', detalle_publicacion_catalogo, name='detalle_publicacion_catalogo'),
]

# Archivos estáticos/media
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)