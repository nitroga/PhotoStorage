window.addEventListener("load", () => {
  loadFolders();
  loadPhotos();
});

let currentImageIndex = 0;
let allPhotos = [];
let touchStartX = 0;
let touchEndX = 0;
let isSelectMode = false;
let selectedPhotos = new Set();

const folderSelect = document.getElementById("folderSelect");
const newFolderBtn = document.getElementById("newFolderBtn");
const uploadForm = document.getElementById("uploadForm");
const uploadFolderSelect = document.getElementById("uploadFolderSelect");
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("sidebarToggle");
const closeBtn = document.getElementById("closeSidebar");

async function loadFolders() {
  const res = await fetch("/folders");
  const folders = await res.json();

  folderSelect.innerHTML = '<option value="">Root Folder</option>';
  const uploadSelect = document.getElementById("uploadFolderSelect");
  uploadSelect.innerHTML = '<option value="">Root Folder</option>';

  folders.forEach((folder) => {
    const option1 = document.createElement("option");
    option1.value = folder;
    option1.textContent = folder;
    folderSelect.appendChild(option1);

    const option2 = option1.cloneNode(true);
    uploadSelect.appendChild(option2);
  });
}

newFolderBtn.addEventListener("click", async () => {
  const name = prompt("Enter new folder name:");
  if (!name) return;
  const res = await fetch("/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (res.ok) {
    await loadFolders();
    folderSelect.value = name;
  } else {
    alert(await res.text());
  }
});

uploadForm.addEventListener("submit", function (e) {
  const selectedFolder = uploadFolderSelect.value || "";
  const safeFolder = encodeURIComponent(selectedFolder);
  this.action = `/upload/${safeFolder}`;
});

function loadPhotos() {
  const selectedFolder = folderSelect.value || "";
  fetch(`/photos?folder=${encodeURIComponent(selectedFolder)}`)
    .then((response) => response.json())
    .then((photos) => {
      allPhotos = photos;
      const gallery = document.getElementById("photoGallery");
      gallery.innerHTML = "";

      photos.forEach((photo, index) => {
        const div = document.createElement("div");
        div.className = "gallery-item";
        if (isSelectMode) {
          div.classList.add("selectable");
          if (selectedPhotos.has(photo)) {
            div.classList.add("selected");
          }
        }

        const img = document.createElement("img");
        img.src = `/storage/${selectedFolder ? `${selectedFolder}/` : ""
          }${photo}`;
        img.alt = photo;

        div.onclick = (e) => {
          if (isSelectMode) {
            togglePhotoSelection(div, photo);
          } else {
            showFullscreen(img.src, index);
          }
        };

        div.appendChild(img);
        gallery.appendChild(div);
      });
    })
    .catch((error) => console.error("Error:", error));
}

function toggleSelectMode() {
  isSelectMode = !isSelectMode;
  selectedPhotos.clear();

  const selectBtn = document.getElementById("selectModeBtn");
  const deleteBtn = document.getElementById("deleteSelectedBtn");
  const cancelBtn = document.getElementById("cancelSelectBtn");

  if (isSelectMode) {
    selectBtn.style.display = "none";
    deleteBtn.style.display = "inline-block";
    deleteBtn.disabled = true; // Disable delete button initially
    cancelBtn.style.display = "inline-block";
  } else {
    selectBtn.style.display = "inline-block";
    deleteBtn.style.display = "none";
    cancelBtn.style.display = "none";
  }

  loadPhotos(); // Refresh the gallery with new interaction mode
}

function togglePhotoSelection(element, photo) {
  if (selectedPhotos.has(photo)) {
    selectedPhotos.delete(photo);
    element.classList.remove("selected");
  } else {
    selectedPhotos.add(photo);
    element.classList.add("selected");
  }

  const deleteBtn = document.getElementById("deleteSelectedBtn");
  deleteBtn.disabled = selectedPhotos.size === 0;
}

function deleteSelectedPhotos() {
  if (selectedPhotos.size === 0) return;

  const selectedFolder = folderSelect.value || "";

  if (
    confirm(`Are you sure you want to delete ${selectedPhotos.size} photos?`)
  ) {
    const deletePromises = Array.from(selectedPhotos).map((photo) =>
      fetch(`/photos/${photo}?folder=${encodeURIComponent(selectedFolder)}`, {
        method: "DELETE",
      }).then((response) => response.json())
    );

    Promise.all(deletePromises)
      .then(() => {
        selectedPhotos.clear();
        toggleSelectMode();
        loadPhotos();
      })
      .catch((error) => console.error("Error deleting photos:", error));
  }
}

function showFullscreen(imageSrc, index) {
  const overlay = document.getElementById("fullscreenOverlay");
  const fullscreenImage = document.getElementById("fullscreenImage");
  currentImageIndex = index; // Set current index
  fullscreenImage.src = imageSrc;
  overlay.style.display = "flex";
}

function showNextImage() {
  if (allPhotos.length === 0) return;
  currentImageIndex = (currentImageIndex + 1) % allPhotos.length;
  const nextPhoto = allPhotos[currentImageIndex];
  document.getElementById("fullscreenImage").src = `/storage/${nextPhoto}`;
}

function showPrevImage() {
  if (allPhotos.length === 0) return;
  currentImageIndex =
    (currentImageIndex - 1 + allPhotos.length) % allPhotos.length;
  const prevPhoto = allPhotos[currentImageIndex];
  document.getElementById("fullscreenImage").src = `/storage/${prevPhoto}`;
}

function closeFullscreen() {
  const overlay = document.getElementById("fullscreenOverlay");
  overlay.style.display = "none";
}

function deletePhoto(filename) {
  if (confirm("Are you sure you want to delete this photo?")) {
    fetch(`/photos/${filename}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then(() => {
        loadPhotos();
      })
      .catch((error) => console.error("Error:", error));
  }
}

const overlay = document.getElementById("fullscreenOverlay");

overlay.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

overlay.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50; // minimum distance for swipe
  const swipeDistance = touchEndX - touchStartX;

  if (Math.abs(swipeDistance) > swipeThreshold) {
    if (swipeDistance > 0) {
      showPrevImage(); // Swipe right
    } else {
      showNextImage(); // Swipe left
    }
  }
}

document
  .getElementById("fullscreenOverlay")
  .addEventListener("click", function (e) {
    if (e.target === this) closeFullscreen();
  });

document.addEventListener("keydown", (e) => {
  if (overlay.style.display === "flex") {
    if (e.key === "ArrowRight") showNextImage();
    if (e.key === "ArrowLeft") showPrevImage();
    if (e.key === "Escape") closeFullscreen();
  }
});

folderSelect.addEventListener("change", loadPhotos);

document
  .getElementById("selectModeBtn")
  .addEventListener("click", toggleSelectMode);
document
  .getElementById("cancelSelectBtn")
  .addEventListener("click", toggleSelectMode);
document
  .getElementById("deleteSelectedBtn")
  .addEventListener("click", deleteSelectedPhotos);

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("closed");
});

closeBtn.addEventListener("click", () => {
  sidebar.classList.add("closed");
});
