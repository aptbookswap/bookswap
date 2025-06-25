document.addEventListener('DOMContentLoaded', function () {
  const checkbox = document.getElementById('habilitarEdicion');
  const formElements = document.querySelectorAll('#formEditarPublicacion input, #formEditarPublicacion textarea, #formEditarPublicacion select');
  const btnModificar = document.getElementById('btnModificar');
  const btnEliminar = document.getElementById('btnEliminar');
  const publicacionId = document.getElementById('publicacion_id').value;


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

  // Deshabilitar solo elementos editables (no el estado ni los del libro)
  checkbox.addEventListener('change', function () {
    const enabled = this.checked;
    formElements.forEach(e => {
      if (!['tipo_transaccion', 'valor', 'descripcion'].includes(e.id)) return;
      e.disabled = !enabled;

    });
    btnModificar.disabled = !enabled;
  });

  btnModificar.addEventListener('click', async () => {
    const tipo = document.getElementById('tipo_transaccion').value;
    const valor = document.getElementById('valor').value;
    const descripcion = document.getElementById('descripcion').value;

    const data = {
      tipo_transaccion: tipo,
      valor: valor,
      descripcion: descripcion
    };

    const response = await fetch(`/api/publicacion/${publicacionId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken('csrftoken')
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (result.success) {
      alert('Publicación modificada correctamente.');
      window.location.reload();
    } else {
      alert('Error al modificar.');
    }
  });

  btnEliminar.addEventListener('click', async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta publicación?')) return;

    const response = await fetch(`/api/publicacion/${publicacionId}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': getCSRFToken('csrftoken')
      }
    });

    const result = await response.json();
    if (result.success) {
      alert('Publicación eliminada.');
      window.location.href = '/publicaciones/';
    } else {
      alert('Error al eliminar.');
    }
  });

  
});
