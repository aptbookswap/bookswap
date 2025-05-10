document.addEventListener('DOMContentLoaded', function () {
  // Lógica de géneros con etiquetas
  const generoDropdown = document.getElementById('generoDropdown');
  const generoTags = document.getElementById('generoTags');
  const generoInput = document.getElementById('generoInput');
  let generosSeleccionados = [];

  generoDropdown.addEventListener('change', () => {
    const value = generoDropdown.value;
    if (value && !generosSeleccionados.includes(value)) {
      generosSeleccionados.push(value);
      actualizarTags();
    }
    generoDropdown.value = "";
  });

  generoTags.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-tag')) {
      const value = e.target.dataset.value;
      generosSeleccionados = generosSeleccionados.filter(g => g !== value);
      actualizarTags();
    }
  });

  function actualizarTags() {
    generoTags.innerHTML = '';
    generosSeleccionados.forEach(genero => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.innerHTML = `${genero} <span class="remove-tag" data-value="${genero}">&times;</span>`;
      generoTags.appendChild(tag);
    });
    generoInput.value = generosSeleccionados.join(',');
  }

  // Lógica de previsualización de imágenes
  const imagenesInput = document.getElementById('imagenesInput');
  const previewContainer = document.getElementById('previewContainer');
  let archivosSeleccionados = [];

  imagenesInput.addEventListener('change', function () {
    archivosSeleccionados = Array.from(this.files);
    renderPreviews();
  });

  function renderPreviews() {
    previewContainer.innerHTML = '';
    archivosSeleccionados.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = e => {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';

        const img = document.createElement('img');
        img.src = e.target.result;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-img';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => {
          archivosSeleccionados.splice(index, 1);
          renderPreviews();
          actualizarInputFiles();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        previewContainer.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    });
  }

  function actualizarInputFiles() {
    const dataTransfer = new DataTransfer();
    archivosSeleccionados.forEach(file => dataTransfer.items.add(file));
    imagenesInput.files = dataTransfer.files;
  }
});
