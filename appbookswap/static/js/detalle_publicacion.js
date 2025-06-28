// ===================== Utilidades =====================
function getCSRFToken() {
  // 1. Buscar en cookies
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      const cookie = c.trim();
      if (cookie.startsWith('csrftoken=')) {
        return decodeURIComponent(cookie.substring('csrftoken='.length));
      }
    }
  }
  // 2. Buscar en el <meta name="csrf-token"> como fallback
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) {
    return meta.getAttribute('content');
  }
  return null;
}

// ===================== Inicialización =====================
document.addEventListener('DOMContentLoaded', function () {
  const checkbox = document.getElementById('habilitarEdicion');
  const formElements = document.querySelectorAll('#formEditarPublicacion input, #formEditarPublicacion textarea, #formEditarPublicacion select');
  const btnModificar = document.getElementById('btnModificar');
  const btnEliminar = document.getElementById('btnEliminar');
  const publicacionId = document.getElementById('publicacion_id').value;
  const editarImagenBtn = document.getElementById('editarImagenPublicacionBtn');
  const editarImagenInput = document.getElementById('editarImagenPublicacionInput');
  const detalleImagen = document.getElementById('detalleImagenPublicacion');

  if (checkbox && editarImagenBtn && editarImagenInput) {
    checkbox.addEventListener('change', function () {
      const editable = this.checked;
      editarImagenBtn.style.display = editable ? 'inline-block' : 'none';
    });

    editarImagenBtn.addEventListener('click', function () {
      editarImagenInput.click();
    });

    editarImagenInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          detalleImagen.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
      if (result.success) {
        editarImagenInput.value = "";
        showModal('Publicación modificada correctamente.', function() {
          window.location.reload();
        });
      }
    });
  }

  // ===================== Habilitar/Deshabilitar edición =====================
  checkbox.addEventListener('change', function () {
    const enabled = this.checked;
    formElements.forEach(e => {
      if (!['tipo_transaccion', 'valor', 'descripcion'].includes(e.id)) return;
      e.disabled = !enabled;
    });
    btnModificar.disabled = !enabled;
  });

  // ===================== Modificar publicación =====================
  btnModificar.addEventListener('click', async () => {
    const tipo = document.getElementById('tipo_transaccion').value;
    const valor = document.getElementById('valor').value;
    const descripcion = document.getElementById('descripcion').value;

    const formData = new FormData();
    formData.append('tipo_transaccion', tipo);
    formData.append('valor', valor);
    formData.append('descripcion', descripcion);

    // Adjuntar imagen solo si se seleccionó una nueva
    if (editarImagenInput.files.length > 0) {
      formData.append('imagen', editarImagenInput.files[0]);
    }

    const response = await fetch(`/api/publicacion/${publicacionId}/`, {
      method: 'PUT',
      headers: {
        'X-CSRFToken': getCSRFToken('csrftoken')
        // No pongas 'Content-Type'
      },
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      showModal('Publicación modificada correctamente.', function() {
        window.location.reload();
      });
    } else {
      showModal('Error al modificar.');
    }
  });
  // ===================== Eliminar publicación =====================
  btnEliminar.addEventListener('click', async () => {
  const response = await fetch(`/api/publicacion/${publicacionId}/`, {
    method: 'DELETE',
    headers: {
      'X-CSRFToken': getCSRFToken('csrftoken')
    }
  });

  const result = await response.json();
  if (result.success) {
    showModal('Publicación eliminada.', function() {
      window.location.href = '/publicaciones/';
    });
  } else {
    showModal('Error al eliminar.');
  }
});


});