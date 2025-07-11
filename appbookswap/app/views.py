from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth import get_user_model, authenticate, login as auth_login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import PasswordResetConfirmView
from django.utils.decorators import method_decorator
from django.template.loader import render_to_string
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import PermissionDenied
from django.db.models import Avg, Q
from rest_framework.response import Response
from django.utils import timezone
from rest_framework import status

import json
import datetime

from .models import Usuario, Libro, ImagenLibro, Message, ValoracionAOfertador, ValoracionAComprador, Publicacion, ImagenPublicacion
from .serializers import UsuarioSerializer, LibroSerializer, ValoracionAOfertadorSerializer, ValoracionACompradorSerializer, PublicacionSerializer
from .forms import MessageForm

User = get_user_model()

# =========================
# VISTAS HTML PRINCIPALES
# =========================

def index(request):
    usuarios_con_ubicacion = Usuario.objects.exclude(ubicacion__isnull=True).exclude(ubicacion__exact='')
    usuario_actual = None
    if request.user.is_authenticated:
        if request.user.ubicacion and ',' in request.user.ubicacion:
            try:
                lng, lat = map(float, request.user.ubicacion.split(','))
                usuario_actual = {
                    'username': request.user.first_name or request.user.username,
                    'ubicacion': request.user.ubicacion
                }
            except (ValueError, AttributeError):
                pass
    return render(request, 'vistas/index.html', {
        'usuarios_con_ubicacion': usuarios_con_ubicacion,
        'usuario_actual': usuario_actual
    })

def registro(request):
    return render(request, 'vistas/register.html')

@login_required
def perfil(request):
    usuarios = Usuario.objects.exclude(id=request.user.id)
    promedios = obtener_promedios_valoraciones(request.user)
    return render(request, 'vistas/perfil.html', {
        'users': usuarios,
        **promedios
    })

@login_required
def user_list(request):
    usuarios = Usuario.objects.exclude(id=request.user.id)
    return render(request, 'vistas/user_list.html', {'users': usuarios})

# =========================
# AUTENTICACIÓN Y REGISTRO
# =========================

@csrf_exempt
def api_registro(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'mensaje': 'Método no permitido'}, status=405)
    try:
        data = json.loads(request.body)
        password = data.get('password')
        if not password or len(password) < 6:
            return JsonResponse({'success': False, 'mensaje': 'Contraseña muy corta'}, status=400)
        fecha_nacimiento = data.get('fecha_nacimiento')
        if fecha_nacimiento:
            fecha = datetime.datetime.strptime(fecha_nacimiento, "%Y-%m-%d").date()
            if fecha > datetime.date.today():
                return JsonResponse({'success': False, 'mensaje': 'La fecha no puede ser futura'}, status=400)
        usuario = Usuario(
            username=data.get('correo'),
            email=data.get('correo'),
            first_name=data.get('nombre'),
            numero=data.get('numero') or None,
            fecha_nacimiento=fecha_nacimiento,
            ubicacion=data.get('ubicacion') or '',
            preferencias=data.get('preferencias') or ''
        )
        usuario.set_password(password)
        usuario.save()
        return JsonResponse({'success': True, 'mensaje': 'Usuario registrado con éxito'})
    except Exception as e:
        print(f'Error en el registro: {e}')
        return JsonResponse({'success': False, 'mensaje': 'Error interno'}, status=500)

def login_usuario(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'mensaje': 'Método no permitido'}, status=405)
    try:
        data = json.loads(request.body)
        identificador = data.get('identificador')
        password = data.get('password')
        try:
            usuario = User.objects.get(email=identificador)
            username = usuario.username
        except User.DoesNotExist:
            username = identificador
        user = authenticate(request, username=username, password=password)
        if user:
            auth_login(request, user)
            return JsonResponse({
                'success': True,
                'nombre': user.first_name,
                'uid': str(user.uid),
                'correo': user.email
            })
        else:
            return JsonResponse({'success': False, 'mensaje': 'Credenciales inválidas'})
    except Exception as e:
        print(f'Error login: {e}')
        return JsonResponse({'success': False, 'mensaje': 'Error interno'}, status=500)
    
def api_logout(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

# =========================
# USUARIO Y PERFIL (DRF)
# =========================

@method_decorator(csrf_exempt, name='dispatch')
class PerfilUsuarioAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    lookup_field = 'uid'
    parser_classes = [MultiPartParser, FormParser]

# =========================
# CHAT Y MENSAJES
# =========================

@login_required
def chat_view(request, uid):
    other_user = get_object_or_404(Usuario, uid=uid)
    messages_qs = Message.objects.filter(
        sender__uid=request.user.uid, recipient__uid=other_user.uid
    ) | Message.objects.filter(
        sender__uid=other_user.uid, recipient__uid=request.user.uid
    )
    messages = messages_qs.order_by('timestamp')
    if request.method == 'POST':
        form = MessageForm(request.POST)
        if form.is_valid():
            msg = form.save(commit=False)
            msg.sender = request.user
            msg.recipient = other_user
            msg.save()
            return redirect('chat', uid=uid)
    else:
        form = MessageForm()
    return render(request, 'vistas/chat.html', {
        'form': form,
        'messages': messages,
        'other_user': other_user
    })

@login_required
def fetch_messages(request, uid):
    other_user = get_object_or_404(Usuario, uid=uid)
    messages = Message.objects.filter(
        sender__uid=request.user.uid, recipient__uid=other_user.uid
    ) | Message.objects.filter(
        sender__uid=other_user.uid, recipient__uid=request.user.uid
    ).order_by('timestamp')
    html = render_to_string('vistas/partials/messages.html', {
        'messages': messages,
        'user': request.user
    })
    return JsonResponse({'html': html})

# =========================
# LIBROS (CRUD Y API)
# =========================

@login_required
def libros_view(request):
    libros = Libro.objects.filter(user=request.user)
    return render(request, 'vistas/libros.html', {'libros': libros})

@login_required
def crear_libro(request):
    if request.method == 'POST':
        libro = Libro.objects.create(
            user=request.user,
            titulo=request.POST.get('titulo'),
            autor=request.POST.get('autor'),
            estado=request.POST.get('estado'),
            genero=request.POST.get('genero'),
            paginas=request.POST.get('paginas'),
            cantidad=request.POST.get('cantidad')
        )
        for img in request.FILES.getlist('imagenes'):
            ImagenLibro.objects.create(libro=libro, imagen=img)
        return redirect('libros')

@login_required
def modificar_libro(request, id_libro):
    libro = get_object_or_404(Libro, id=id_libro)
    if request.method == 'POST':
        libro.titulo = request.POST.get('titulo')
        libro.autor = request.POST.get('autor')
        libro.genero = request.POST.get('genero')
        libro.cantidad = request.POST.get('cantidad')
        libro.save()
        messages.success(request, 'Libro actualizado con éxito.')
    return redirect('libros')

@login_required
def eliminar_libro(request, id_libro):
    libro = get_object_or_404(Libro, id=id_libro)
    if request.method == 'POST':
        libro.delete()
        messages.success(request, 'Libro eliminado con éxito.')
    return redirect('libros')

@method_decorator(csrf_exempt, name='dispatch')
class LibroAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer
    lookup_field = 'id_libro'
    parser_classes = [MultiPartParser, FormParser, JSONParser]

# =========================
# PASSWORD RESET
# =========================

@method_decorator(csrf_protect, name='dispatch')
class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    template_name = 'password_reset/confirm.html'
    success_url = '/reset/done/'
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['user'] = self.user  
        return context

# =========================
# VALORACIONES (API)
# =========================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def valorar_ofertador(request):
    try:
        ofertador_uid = request.data.get('ofertador_id')  
        ofertador = Usuario.objects.get(uid=ofertador_uid)
    except Usuario.DoesNotExist:
        return Response({'success': False, 'mensaje': 'Ofertador no encontrado'}, status=404)
    data = {
        'comprador': request.user.uid,
        'ofertador': ofertador.uid,
        'puntuacion': request.data.get('rating'),  
        'comentario': request.data.get('comentario')
    }
    serializer = ValoracionAOfertadorSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response({'success': True, 'mensaje': 'Valoración al ofertador registrada'})
    return Response({'success': False, 'errores': serializer.errors}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def valorar_comprador(request):
    try:
        comprador_uid = request.data.get('comprador_id')  
        comprador = Usuario.objects.get(uid=comprador_uid)
    except Usuario.DoesNotExist:
        return Response({'success': False, 'mensaje': 'Comprador no encontrado'}, status=404)
    data = {
        'ofertador': request.user.uid,
        'comprador': comprador.uid,
        'puntuacion': request.data.get('rating'),  
        'comentario': request.data.get('comentario')
    }
    serializer = ValoracionACompradorSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response({'success': True, 'mensaje': 'Valoración al comprador registrada'})
    return Response({'success': False, 'errores': serializer.errors}, status=400)

# =========================
# PUBLICACIONES (CRUD Y API)
# =========================

@login_required
def publicaciones_view(request):
    publicaciones = Publicacion.objects.filter(user_ofertador=request.user)
    borradores = publicaciones.filter(estado_publicacion='borrador')
    disponibles = publicaciones.filter(estado_publicacion='disponible')
    en_espera = publicaciones.filter(estado_publicacion='en_espera')
    en_proceso = publicaciones.filter(estado_publicacion='en_proceso')
    canceladas = publicaciones.filter(estado_publicacion='cancelado')
    completadas = publicaciones.filter(estado_publicacion='completado')
    return render(request, 'vistas/publicaciones.html', {
        'borradores': borradores,
        'disponibles': disponibles,
        'en_espera': en_espera,
        'en_proceso': en_proceso,
        'canceladas': canceladas,
        'completadas': completadas,
    })

@login_required
def crear_publicacion_view(request):
    libros = Libro.objects.filter(user=request.user)
    return render(request, 'vistas/crear_publicacion.html', {'libros': libros})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_publicacion(request):
    try:
        data = request.data
        uid_usuario = data.get('user')
        libro_id = data.get('libro')
        tipo = data.get('tipo_transaccion')
        descripcion = data.get('descripcion')
        valor = data.get('valor') or 0
        if not all([uid_usuario, libro_id, tipo, descripcion]):
            return Response({'error': 'Faltan datos obligatorios'}, status=400)
        usuario = get_object_or_404(Usuario, uid=uid_usuario)
        libro = get_object_or_404(Libro, id_libro=libro_id)
        publicacion = Publicacion.objects.create(
            user_ofertador=usuario,
            libro=libro,
            tipo_transaccion=tipo.lower(),  
            valor=valor,
            descripcion=descripcion,
            estado_publicacion="borrador"
        )
        for archivo in request.FILES.getlist('imagenes'):
            ImagenPublicacion.objects.create(publicacion=publicacion, imagen=archivo)
        return Response({'success': True, 'id': publicacion.id_publicacion}, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@login_required
def detalle_publicacion_view(request, id_publicacion):
    publicacion = get_object_or_404(Publicacion, id_publicacion=id_publicacion, user_ofertador=request.user)
    return render(request, 'vistas/detalle_publicacion.html', {
        'publicacion': publicacion,
        'libro': publicacion.libro
    })

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def publicacion_detalle(request, id_publicacion):
    try:
        publicacion = Publicacion.objects.get(id_publicacion=id_publicacion)
    except Publicacion.DoesNotExist:
        return JsonResponse({'error': 'Publicación no encontrada'}, status=404)

    if request.method == 'GET':
        return JsonResponse({
            'id': publicacion.id_publicacion,
            'tipo_transaccion': publicacion.tipo_transaccion,
            'valor': publicacion.valor,
            'descripcion': publicacion.descripcion,
            'estado_publicacion': publicacion.estado_publicacion,
            'libro': {
                'titulo': publicacion.libro.titulo,
                'autor': publicacion.libro.autor,
                'estado': publicacion.libro.estado,
                'genero': publicacion.libro.genero,
                'paginas': publicacion.libro.paginas,
                'cantidad': publicacion.libro.cantidad,
                'imagenes': [img.imagen.url for img in publicacion.imagenes.all()]
            }
        })

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            publicacion.tipo_transaccion = data.get('tipo_transaccion', publicacion.tipo_transaccion)
            publicacion.valor = data.get('valor', publicacion.valor)
            publicacion.descripcion = data.get('descripcion', publicacion.descripcion)
            publicacion.estado_publicacion = data.get('estado_publicacion', publicacion.estado_publicacion)
            publicacion.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'DELETE':
        publicacion.delete()
        return JsonResponse({'success': True})

    return JsonResponse({'error': 'Método no permitido'}, status=405)

@login_required
def publicaciones_usuario_view(request, uid):
    usuario = get_object_or_404(Usuario, uid=uid)
    publicaciones = Publicacion.objects.filter(user_ofertador=usuario, estado_publicacion='disponible')
    promedios = obtener_promedios_valoraciones(usuario)
    return render(request, 'vistas/publicaciones_usuario.html', {
        'usuario': usuario,
        'publicaciones': publicaciones,
        **promedios
    })

# =========================
# ACCIONES SOBRE PUBLICACIONES
# =========================

def aceptar_publicacion(request, publicacion_id): 
    try:
        data = json.loads(request.body)
        comprador_uid = data.get('comprador_uid')
        if not comprador_uid:
            return JsonResponse({'success': False, 'error': 'No se recibió el UID del comprador'}, status=400)
        publicacion = get_object_or_404(Publicacion, id_publicacion=publicacion_id)
        comprador = get_object_or_404(Usuario, uid=comprador_uid)
        if publicacion.user_comprador is not None:
            return JsonResponse({'success': False, 'error': 'Esta publicación ya fue aceptada'}, status=400)
        publicacion.user_comprador = comprador
        publicacion.estado_publicacion = 'en_espera'
        publicacion.save()
        return JsonResponse({'success': True})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Formato de datos incorrecto'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
def confirmar_en_proceso(request, publicacion_id):
    try:
        publicacion = get_object_or_404(Publicacion, id_publicacion=publicacion_id)
        if request.user != publicacion.user_ofertador:
            return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)
        if publicacion.estado_publicacion != 'en_espera':
            return JsonResponse({'success': False, 'error': 'La publicación no está en espera'}, status=400)
        publicacion.estado_publicacion = 'en_proceso'
        publicacion.save()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

def cancelar_publicacion(request, publicacion_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
    try:
        publicacion = get_object_or_404(Publicacion, id_publicacion=publicacion_id)
        usuario = request.user
        if usuario != publicacion.user_ofertador and usuario != publicacion.user_comprador:
            return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)
        if publicacion.estado_publicacion not in ['en_espera', 'en_proceso']:
            return JsonResponse({'success': False, 'error': 'No se puede cancelar en el estado actual'}, status=400)
        
        # Crear copia histórica antes de cancelar
        publicacion_hist = Publicacion.objects.create(
            user_ofertador=publicacion.user_ofertador,
            libro=publicacion.libro,
            tipo_transaccion=publicacion.tipo_transaccion,
            valor=publicacion.valor,
            descripcion=publicacion.descripcion,
            estado_publicacion="cancel_history",
            user_comprador=publicacion.user_comprador,
            ticket_comprador=publicacion.ticket_comprador,
            ticket_ofertador=publicacion.ticket_ofertador,
            fecha_termino=publicacion.fecha_termino
        )
        # Copiar imágenes
        for img in publicacion.imagenes.all():
            ImagenPublicacion.objects.create(publicacion=publicacion_hist, imagen=img.imagen)

        # Cancelar publicación original y borrar comprador
        publicacion.estado_publicacion = 'cancelado'
        publicacion.user_comprador = None
        publicacion.save()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])    
def volver_a_disponible(request, publicacion_id):
    try:
        publicacion = Publicacion.objects.get(id_publicacion=publicacion_id)
        if publicacion.user_ofertador != request.user:
            return Response({'success': False, 'error': 'No tienes permiso'}, status=403)
        if publicacion.estado_publicacion in ['cancelado', 'completado', 'en_espera', 'en_proceso']:
            publicacion.estado_publicacion = 'disponible'
            publicacion.user_comprador = None
            publicacion.save()
            return Response({'success': True, 'mensaje': 'Publicación reactivada'})
        else:
            return Response({'success': False, 'error': 'Estado no válido'}, status=400)
    except Publicacion.DoesNotExist:
        return Response({'success': False, 'error': 'Publicación no encontrada'}, status=404)

@login_required
def marcar_completado(request, publicacion_id):
    try:
        publicacion = get_object_or_404(Publicacion, id_publicacion=publicacion_id)
        if request.user != publicacion.user_ofertador and request.user != publicacion.user_comprador:
            return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)
        if publicacion.estado_publicacion != 'en_proceso' and publicacion.estado_publicacion != 'pendiente':
            return JsonResponse({'success': False, 'error': 'La publicación no está en proceso o pendiente'}, status=400)
        if request.user == publicacion.user_comprador:
            publicacion.ticket_comprador = True
        elif request.user == publicacion.user_ofertador:
            publicacion.ticket_ofertador = True
        if publicacion.ticket_comprador and publicacion.ticket_ofertador:
            publicacion.estado_publicacion = 'completado'
            publicacion.fecha_termino = timezone.now()
        else:
            publicacion.estado_publicacion = 'pendiente'
        publicacion.save()
        return JsonResponse({'success': True, 'estado': publicacion.estado_publicacion})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
def detalle_publicacion_estado_view(request, id_publicacion):
    publicacion = get_object_or_404(Publicacion, id_publicacion=id_publicacion)
    if publicacion.estado_publicacion == 'borrador':
        return redirect('detalle_publicacion', id_publicacion=publicacion.id_publicacion)
    if request.user != publicacion.user_ofertador and request.user != publicacion.user_comprador:
        raise PermissionDenied("No tienes permiso para ver esta publicación.")
    comprador = publicacion.user_comprador
    ofertador = publicacion.user_ofertador
    promedios_comprador = obtener_promedios_valoraciones(comprador) if comprador else {}
    promedios_ofertador = obtener_promedios_valoraciones(ofertador)
    return render(request, 'vistas/detalle_publicacion_estado.html', {
        'publicacion': publicacion,
        'libro': publicacion.libro,
        'promedios_comprador': promedios_comprador,
        'promedios_ofertador': promedios_ofertador,
    })

def Publicar(request, publicacion_id):
    try:
        publicacion = get_object_or_404(Publicacion, id_publicacion=publicacion_id)
        if request.user != publicacion.user_ofertador:
            return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)
        publicacion.estado_publicacion = 'disponible'
        publicacion.user_comprador = None
        publicacion.save()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

# =========================
# PUBLICACIONES DEL COMPRADOR
# =========================

@login_required
def publicaciones_comprador_view(request):
    publicaciones = Publicacion.objects.filter(user_comprador=request.user)
    en_espera = publicaciones.filter(estado_publicacion='en_espera')
    en_proceso = publicaciones.filter(estado_publicacion='en_proceso')
    completadas = publicaciones.filter(estado_publicacion='completado')
    canceladas = publicaciones.filter(estado_publicacion='cancelado')
    pendiente = publicaciones.filter(estado_publicacion='pendiente')
    cancelados_history = publicaciones.filter(estado_publicacion='cancel_history')
    return render(request, 'vistas/publicaciones_comprador.html', {
        'en_espera': en_espera,
        'en_proceso': en_proceso,
        'completadas': completadas,
        'canceladas': canceladas,
        'pendiente': pendiente,
        'cancelados_history': cancelados_history,
    })

# =========================
# UTILIDADES Y FUNCIONES AUXILIARES
# =========================

def obtener_promedios_valoraciones(usuario):
    promedio_comprador = ValoracionAComprador.objects.filter(comprador=usuario.uid).aggregate(prom=Avg('puntuacion'))['prom']
    promedio_ofertador = ValoracionAOfertador.objects.filter(ofertador=usuario.uid).aggregate(prom=Avg('puntuacion'))['prom']
    return {
        'promedio_comprador': round(promedio_comprador or 0, 1),
        'promedio_ofertador': round(promedio_ofertador or 0, 1)
    }

@login_required
def marcar_ticket_completado(request, id_publicacion):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    try:
        publicacion = Publicacion.objects.get(id_publicacion=id_publicacion)
    except Publicacion.DoesNotExist:
        return JsonResponse({'error': 'Publicación no encontrada'}, status=404)
    usuario = request.user
    modificado = False
    if usuario.uid == str(publicacion.user_comprador_id):
        publicacion.ticket_comprador = True
        modificado = True
    elif usuario.uid == str(publicacion.user_ofertador_id):
        publicacion.ticket_ofertador = True
        modificado = True
    else:
        return JsonResponse({'error': 'No autorizado'}, status=403)
    if modificado and publicacion.estado_publicacion == 'en_proceso':
        publicacion.estado_publicacion = 'pendiente'
    if publicacion.ticket_comprador and publicacion.ticket_ofertador:
        publicacion.estado_publicacion = 'completado'
        publicacion.fecha_termino = timezone.now()
    publicacion.save()
    return


def catalogo_publicaciones_ajax(request):
    publicaciones = Publicacion.objects.filter(estado_publicacion='disponible')
    # Excluir publicaciones del usuario autenticado
    if request.user.is_authenticated:
        publicaciones = publicaciones.exclude(user_ofertador=request.user)
    query = request.GET.get('q', '')
    filtro_genero = request.GET.get('pref', '')
    filtro_top = request.GET.get('top', '')
    filtro_tipo = request.GET.get('tipo', '')
    filtro_estado = request.GET.get('estado', '')

    if query:
        publicaciones = publicaciones.filter(libro__titulo__icontains=query)
    if filtro_genero:
        publicaciones = publicaciones.filter(libro__genero__icontains=filtro_genero)
    if filtro_tipo:
        publicaciones = publicaciones.filter(tipo_transaccion=filtro_tipo)
    if filtro_estado:
        publicaciones = publicaciones.filter(libro__estado=filtro_estado)
    if filtro_top == '1':
        mejores = ValoracionAComprador.objects.values('comprador').annotate(prom=Avg('puntuacion')).order_by('-prom')[:10]
        mejores_ids = [m['comprador'] for m in mejores]
        publicaciones = publicaciones.filter(user_ofertador__uid__in=mejores_ids)

    html = render_to_string('vistas/partials/catalogo_publicaciones.html', {
        'publicaciones': publicaciones
    }, request=request)
    return JsonResponse({'html': html})

def detalle_publicacion_catalogo(request, id_publicacion):
    publicacion = get_object_or_404(Publicacion, id_publicacion=id_publicacion)
    return render(request, 'vistas/detalle_publicacion_catalogo.html', {
        'publicacion': publicacion
    })

def terminos_condiciones(request):
    return render(request, 'vistas/terminos_condiciones.html')