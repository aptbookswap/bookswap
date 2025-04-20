from django.urls import path
from . import views 
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.index, name='index'),
    path('registro/', views.registro, name='registro'),
    path('api/registro/', views.api_registro, name='api_registro'),
    path('api/login/', views.login_usuario, name='login_usuario'),
    path('api/perfil/<uuid:uid>/', views.PerfilUsuarioAPIView.as_view(), name='perfil_usuario'),
    path('perfil/', views.perfil, name='perfil'),

    

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
