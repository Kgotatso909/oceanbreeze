
  document.addEventListener('DOMContentLoaded', () => {
    AOS.init();

    const images = [
        { url: "assets/images/outdoors/outdoor-1.jpg", category: "outdoor" },
        { url: "assets/images/rooms/room-2.webp", category: "rooms" },
        {
          url: "assets/images/activities/activity-1.jpg",
          category: "activities",
        },
        { url: "assets/images/outdoors/outdoor-2.jpg", category: "outdoor" },
        { url: "assets/images/rooms/room-3.webp", category: "rooms" },
        {
          url: "assets/images/activities/activity-2.jpg",
          category: "activities",
        },
        { url: "assets/images/outdoors/outdoor-3.jpg", category: "outdoor" },
        { url: "assets/images/rooms/room-6.webp", category: "rooms" },
        {
          url: "assets/images/activities/activity-3.jpg",
          category: "activities",
        },
        { url: "assets/images/outdoors/outdoor-4.jpg", category: "outdoor" },
        { url: "assets/images/rooms/room-1.webp", category: "rooms" },
        {
          url: "assets/images/activities/activity-4.jpg",
          category: "activities",
         },
        { url: "assets/images/outdoors/outdoor-5.jpg", category: "outdoor" },
        { url: "assets/images/rooms/room-5.webp", category: "rooms" },
        {
          url: "assets/images/activities/activity-5.jpg",
          category: "activities",
        },
        { url: "assets/images/outdoors/outdoor-6.jpg", category: "outdoor" },
        { url: "assets/images/rooms/room-4.webp", category: "rooms" },
        {
          url: "assets/images/activities/activity-6.jpg",
          category: "activities",
        },
      ];

      const masonryGrid = document.getElementById("masonryGrid");
      const categoryButtons = document.querySelectorAll(
        ".category-buttons button"
      );
      const fullscreenViewer = document.getElementById("fullscreenViewer");
      const fullscreenImage = document.getElementById("fullscreenImage");
      const fullscreenClose = document.getElementById("fullscreenClose");
      const fullscreenPrev = document.getElementById("fullscreenPrev");
      const fullscreenNext = document.getElementById("fullscreenNext");

      let currentCategory = "all";
      let currentIndex = 0;

      function loadGallery(category) {
        masonryGrid.innerHTML = "";
        const filteredImages =
          category === "all"
            ? images
            : images.filter((image) => image.category === category);
        filteredImages.forEach((image, index) => {
          const item = document.createElement("div");
          item.className = "masonry-item";
          item.innerHTML = `<img src="${image.url}" alt="Ocrean Breeze gallery image ${index + 1}">`;
          item.addEventListener("click", () =>
            openFullscreen(index, filteredImages)
          );
          masonryGrid.appendChild(item);
        });
      }

      function openFullscreen(index, filteredImages) {
        currentIndex = index;
        fullscreenImage.src = filteredImages[currentIndex].url;
        fullscreenViewer.style.display = "flex";
      }

      function closeFullscreen() {
        fullscreenViewer.style.display = "none";
      }

      function showNextImage() {
        const filteredImages =
          currentCategory === "all"
            ? images
            : images.filter((image) => image.category === currentCategory);
        currentIndex = (currentIndex + 1) % filteredImages.length;
        fullscreenImage.src = filteredImages[currentIndex].url;
      }

      function showPrevImage() {
        const filteredImages =
          currentCategory === "all"
            ? images
            : images.filter((image) => image.category === currentCategory);
        currentIndex =
          (currentIndex - 1 + filteredImages.length) % filteredImages.length;
        fullscreenImage.src = filteredImages[currentIndex].url;
      }

      // Event Listeners
      categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
          currentCategory = button.getAttribute("data-category");
          loadGallery(currentCategory);
          categoryButtons.forEach((btn) => btn.classList.remove("btn-primary"));
          button.classList.add("btn-primary");
        });
      });

      fullscreenClose.addEventListener("click", closeFullscreen);
      fullscreenPrev.addEventListener("click", showPrevImage);
      fullscreenNext.addEventListener("click", showNextImage);

      // Initial Load
      loadGallery("all");
  })
