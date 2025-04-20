from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Usuario
from .serializers import UsuarioSerializer
from django.contrib.auth import get_user_model, authenticate
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils.decorators import method_decorator
import json

User = get_user_model()

# Vistas HTML
def index(request):
    return render(request, 'vistas/index.html')

def registro(request):
    return render(request, 'vistas/register.html')

def perfil(request):
    return render(request, 'vistas/perfil.html')


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

        usuario = Usuario(
            username=data.get('correo'),
            email=data.get('correo'),
            first_name=data.get('nombre'),
            numero=data.get('numero') or None,
            anno_nacimiento=data.get('anno_nacimiento'),
            ubicacion=data.get('ubicacion') or '',
            preferencias=data.get('preferencias') or ''  # ✅ preferencias como string
        )
        usuario.set_password(password)
        usuario.save()

        return JsonResponse({'success': True, 'mensaje': 'Usuario registrado con éxito'})

    except Exception as e:
        print(f'Error en el registro: {e}')
        return JsonResponse({'success': False, 'mensaje': 'Error interno'}, status=500)



# Login de usuario
@csrf_exempt
def login_usuario(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'mensaje': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
        identificador = data.get('identificador')
        password = data.get('password')

        print(f"Intentando login con: {identificador}, password: {'*' * len(password)}")

        try:
            usuario = User.objects.get(email=identificador)
            username = usuario.username
        except User.DoesNotExist:
            username = identificador

        user = authenticate(request, username=username, password=password)

        if user is not None:
            print("Usuario autenticado:", user.username)
            return JsonResponse({
                'success': True,
                'nombre': user.first_name,
                'uid': str(user.uid),
                'correo': user.email
            })
        else:
            print("Falló autenticación")
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
