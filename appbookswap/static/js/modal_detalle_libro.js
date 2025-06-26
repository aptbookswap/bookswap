// ===================== Inicialización =====================
document.addEventListener('DOMContentLoaded', function () {
  // ===================== Variables =====================
  const generoDropdown = document.getElementById('generoDropdownEdit');
  const generoTags = document.getElementById('generoTagsEdit');
  const generoInput = document.getElementById('generoEdit');
  const toggleEdit = document.getElementById('toggleEdit');
  let generosSeleccionados = [];

  // ===================== Función para cargar géneros =====================
  window.cargarGenerosLibro = function (generosStr) {
    generosSeleccionados = generosStr.split(',').map(p => p.trim()).filter(Boolean);
    updateTags();
  };

  // ===================== Manejo del dropdown de géneros =====================
  generoDropdown.addEventListener('change', function () {
    const selected = this.value;
    if (selected && !generosSeleccionados.includes(selected)) {
      generosSeleccionados.push(selected);
      updateTags();
    }
    this.value = '';
  });

  // ===================== Manejo de tags de géneros =====================
  generoTags.addEventListener('click', function (e) {
    if (!toggleEdit.checked) return;
    if (e.target.classList.contains('remove-tag')) {
      const value = e.target.getAttribute('data-value');
      generosSeleccionados = generosSeleccionados.filter(g => g !== value);
      updateTags();
    }
  });

  // ===================== Actualización visual de tags =====================
  function updateTags() {
    generoTags.innerHTML = '';
    generosSeleccionados.forEach(genero => {
      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.innerHTML = `${genero} ${toggleEdit.checked ? `<span class="remove-tag" data-value="${genero}">&times;</span>` : ''}`;
      generoTags.appendChild(tag);
    });
    generoInput.value = generosSeleccionados.join(',');
  }

  // ===================== Habilitar/Deshabilitar edición =====================
  if (toggleEdit) {
    toggleEdit.addEventListener('change', function () {
      const editable = this.checked;
      document.querySelectorAll('#libroForm input, #libroForm select').forEach(el => {
        el.disabled = !editable;
      });
      document.getElementById('guardarCambiosBtn').disabled = !editable;
      document.getElementById('confirmarEliminarBtn').disabled = !editable;
      generoDropdown.style.display = editable ? 'block' : 'none';
      updateTags();
    });

    generoDropdown.style.display = 'none';
  }
});