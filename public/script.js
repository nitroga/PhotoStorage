window.addEventListener('load', loadPhotos);

let currentImageIndex = 0;
let allPhotos = [];
let touchStartX = 0;
let touchEndX = 0;
let isSelectMode = false;
let selectedPhotos = new Set();

function loadPhotos() {
    fetch('/photos')
        .then(response => response.json())
        .then(photos => {
            allPhotos = photos;
            const gallery = document.getElementById('photoGallery');
            gallery.innerHTML = '';
            
            photos.forEach((photo, index) => {
                const div = document.createElement('div');
                div.className = 'gallery-item';
                if (isSelectMode) {
                    div.classList.add('selectable');
                    if (selectedPhotos.has(photo)) {
                        div.classList.add('selected');
                    }
                }
                
                const img = document.createElement('img');
                img.src = `/storage/${photo}`;
                img.alt = photo;
                
                // Handle click events based on mode
                div.onclick = (e) => {
                    if (isSelectMode) {
                        togglePhotoSelection(div, photo);
                    } else {
                        showFullscreen(`/storage/${photo}`, index);
                    }
                };
                
                div.appendChild(img);
                gallery.appendChild(div);
            });
        })
        .catch(error => console.error('Error:', error));
}

// Update toggleSelectMode to enable/disable selection mode properly
function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    selectedPhotos.clear();
    
    const selectBtn = document.getElementById('selectModeBtn');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const cancelBtn = document.getElementById('cancelSelectBtn');
    
    if (isSelectMode) {
        selectBtn.style.display = 'none';
        deleteBtn.style.display = 'inline-block';
        deleteBtn.disabled = true; // Disable delete button initially
        cancelBtn.style.display = 'inline-block';
    } else {
        selectBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    }
    
    loadPhotos(); // Refresh the gallery with new interaction mode
}

function togglePhotoSelection(element, photo) {
    if (selectedPhotos.has(photo)) {
        selectedPhotos.delete(photo);
        element.classList.remove('selected');
    } else {
        selectedPhotos.add(photo);
        element.classList.add('selected');
    }
    
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    deleteBtn.disabled = selectedPhotos.size === 0;
}

function deleteSelectedPhotos() {
    if (selectedPhotos.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedPhotos.size} photos?`)) {
        const deletePromises = Array.from(selectedPhotos).map(photo =>
            fetch(`/photos/${photo}`, { method: 'DELETE' })
                .then(response => response.json())
        );
        
        Promise.all(deletePromises)
            .then(() => {
                selectedPhotos.clear();
                toggleSelectMode();
                loadPhotos();
            })
            .catch(error => console.error('Error deleting photos:', error));
    }
}

function showFullscreen(imageSrc, index) {
    const overlay = document.getElementById('fullscreenOverlay');
    const fullscreenImage = document.getElementById('fullscreenImage');
    currentImageIndex = index; // Set current index
    fullscreenImage.src = imageSrc;
    overlay.style.display = 'flex';
}

function showNextImage() {
    if (allPhotos.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % allPhotos.length;
    const nextPhoto = allPhotos[currentImageIndex];
    document.getElementById('fullscreenImage').src = `/storage/${nextPhoto}`;
}

function showPrevImage() {
    if (allPhotos.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + allPhotos.length) % allPhotos.length;
    const prevPhoto = allPhotos[currentImageIndex];
    document.getElementById('fullscreenImage').src = `/storage/${prevPhoto}`;
}

function closeFullscreen() {
    const overlay = document.getElementById('fullscreenOverlay');
    overlay.style.display = 'none';
}

function deletePhoto(filename) {
    if (confirm('Are you sure you want to delete this photo?')) {
        fetch(`/photos/${filename}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(() => {
            loadPhotos(); // Reload the gallery
        })
        .catch(error => console.error('Error:', error));
    }
}

const overlay = document.getElementById('fullscreenOverlay');

overlay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

overlay.addEventListener('touchend', (e) => {
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

// Close fullscreen when clicking outside the image
document.getElementById('fullscreenOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeFullscreen();
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (overlay.style.display === 'flex') {
        if (e.key === 'ArrowRight') showNextImage();
        if (e.key === 'ArrowLeft') showPrevImage();
        if (e.key === 'Escape') closeFullscreen();
    }
});

// Add these event listeners at the bottom of your file
document.getElementById('selectModeBtn').addEventListener('click', toggleSelectMode);
document.getElementById('cancelSelectBtn').addEventListener('click', toggleSelectMode);
document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedPhotos);