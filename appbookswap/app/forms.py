from django import forms
from .models import Message, Libro, ImagenLibro

class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['content']
        widgets = {
            'content': forms.TextInput(attrs={
                'placeholder': 'Escribe un mensaje...',
                'class': 'form-control'
            })
        }
class LibroForm(forms.ModelForm):
    class Meta:
        model = Libro
        fields = ['titulo', 'autor', 'estado', 'genero', 'paginas', 'cantidad']

class ImagenLibroForm(forms.ModelForm):
    class Meta:
        model = ImagenLibro
        fields = ['imagen']