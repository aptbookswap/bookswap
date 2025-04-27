from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Usuario
from .serializers import UsuarioSerializer
from django.contrib.auth import get_user_model, authenticate, login as auth_login
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils.decorators import method_decorator
from .models import Message
from .forms import MessageForm
from django.template.loader import render_to_string 
from django.contrib.auth.decorators import login_required
from .models import Libro, ImagenLibro
from .forms import LibroForm, ImagenLibroForm
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from .serializers import LibroSerializer
from django.contrib import messages
import json
import datetime

User = get_user_model()

# Vistas HTML
def index(request):
    return render(request, 'vistas/index.html')

def registro(request):
    return render(request, 'vistas/register.html')

def perfil(request):
    usuarios = Usuario.objects.exclude(id=request.user.id)
    return render(request, 'vistas/perfil.html', {'users': usuarios})


# Registro de usuario
@csrf_exempt
def api_registro(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'mensaje': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
        password = data.get('password')

        if not password or len(password) < 6:
            return JsonResponse({'success': False, 'mensaje': 'Contraseña muy corta'}, status=400)

        # Validar que la fecha no sea en el futuro
        fecha_nacimiento = data.get('fecha_nacimiento')
        if fecha_nacimiento:
            fecha_nacimiento_dt = datetime.datetime.strptime(fecha_nacimiento, "%Y-%m-%d").date()
            if fecha_nacimiento_dt > datetime.date.today():
                return JsonResponse({'success': False, 'mensaje': 'La fecha de nacimiento no puede ser en el futuro.'}, status=400)

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

# Login de usuario con auth_login
@csrf_exempt
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

        if user is not None:
            auth_login(request, user)  # ✅ Aquí se guarda la sesión
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


# Perfil con DRF
@method_decorator(csrf_exempt, name='dispatch')
class PerfilUsuarioAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    lookup_field = 'uid'
    parser_classes = [MultiPartParser, FormParser]


@login_required
def user_list(request):
    users = Usuario.objects.exclude(id=request.user.id)
    return render(request, 'vistas/user_list.html', {'users': users})


@login_required
def chat_view(request, uid):
    other_user = get_object_or_404(Usuario, uid=uid)

    messages = Message.objects.filter(
        sender__uid=request.user.uid, recipient__uid=other_user.uid
    ) | Message.objects.filter(
        sender__uid=other_user.uid, recipient__uid=request.user.uid
    )

    messages = messages.order_by('timestamp')

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
    )
    messages = messages.order_by('timestamp')

    html = render_to_string('vistas/partials/messages.html', {
        'messages': messages,
        'user': request.user
    })
    return JsonResponse({'html': html})




@method_decorator(csrf_exempt, name='dispatch')
class LibroAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer
    lookup_field = 'id_libro'
    parser_classes = [MultiPartParser, FormParser, JSONParser] 



@login_required
def libros_view(request):
    libros = Libro.objects.filter(user=request.user)
    return render(request, 'vistas/libros.html', {'libros': libros})


@csrf_exempt
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
        return redirect('libros')  # Redirige a la lista de libros

    return redirect('libros')


@login_required
def eliminar_libro(request, id_libro):
    libro = get_object_or_404(Libro, id=id_libro)

    if request.method == 'POST':
        libro.delete()
        messages.success(request, 'Libro eliminado con éxito.')
        return redirect('libros')

    return redirect('libros')