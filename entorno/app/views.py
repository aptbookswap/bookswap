from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

def index(request):
    return render(request, 'vistas/index.html')

def registro(request):
    return render(request, 'vistas/register.html')

@csrf_exempt  # Solo para pruebas
def api_registro(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'mensaje': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return JsonResponse({'success': False, 'mensaje': 'Campos incompletos'}, status=400)

        # Aquí puedes guardar un usuario real más adelante
        print(f"Registrando: {email} - {password}")

        return JsonResponse({'success': True, 'mensaje': 'Registro exitoso'})
    except Exception as e:
        return JsonResponse({'success': False, 'mensaje': str(e)}, status=500)
