document.addEventListener('DOMContentLoaded', function () {

    const hamburgerToggle = document.getElementById('hamburger-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebar-close');

    hamburgerToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });

    sidebarClose.addEventListener('click', function() {
        sidebar.classList.remove('open');
    });
    document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && !hamburgerToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    
    const navLinks = document.querySelectorAll('a[href^="#"], .sidebar-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            window.scrollTo({
                top: targetElement.offsetTop - 50, 
                behavior: 'smooth'
            });
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });


    AOS.init({
        duration: 1000,
        easing: 'ease-in-out', 
      });


      function setupDropdown(selectId) {
            const select = document.getElementById(selectId);
            if (!select) return;

            const customDropdown = document.createElement("div");
            customDropdown.classList.add("custom-dropdown");

            const selected = document.createElement("div");
            selected.classList.add("selected");
            selected.textContent = select.options[select.selectedIndex].text;
            customDropdown.appendChild(selected);

            const dropdownList = document.createElement("div");
            dropdownList.classList.add("dropdown-list");

            Array.from(select.options).forEach((option) => {
                const item = document.createElement("div");
                item.textContent = option.text;
                item.setAttribute("data-value", option.value);
                item.addEventListener("click", () => {
                    selected.textContent = option.text;
                    select.value = option.value;
                    dropdownList.style.display = "none";
                    customDropdown.classList.remove("active");
                });
                dropdownList.appendChild(item);
            });

            customDropdown.appendChild(dropdownList);
            select.style.display = "none";
            select.parentNode.insertBefore(customDropdown, select);

            selected.addEventListener("click", () => {
                dropdownList.style.display =
                    dropdownList.style.display === "block" ? "none" : "block";
                customDropdown.classList.toggle("active");
            });

            document.addEventListener("click", (event) => {
                if (!customDropdown.contains(event.target)) {
                    dropdownList.style.display = "none";
                    customDropdown.classList.remove("active");
                }
            });
        }

        setupDropdown("roomNumber");
        setupDropdown("month");

            const carousels = document.querySelectorAll('.carousel'); // Get all carousels
          
            carousels.forEach((carousel) => {
              const images = carousel.querySelectorAll('.carousel-image'); // Get images within each carousel
              let currentIndex = 0;
          
              // Show the first image initially
              images[currentIndex].classList.add('active');
          
              function showNextImage() {
                // Remove 'active' class from the current image
                images[currentIndex].classList.remove('active');
          
                // Update the index to show the next image
                currentIndex = (currentIndex + 1) % images.length;
          
                // Add 'active' class to the next image
                images[currentIndex].classList.add('active');
              }
          
              // Slide every 3 seconds for each carousel independently
              setInterval(showNextImage, 3000);
            });    

  
});

