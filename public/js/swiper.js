$(document).ready(function() {
  // Dynamically set image sources from data attributes
  $(".room-card").each(function() {
    let imgSrc = $(this).attr("data-image");
    $(this).find(".room-image").attr("src", imgSrc);
  });

  // Initialize Fancybox
  $(".room-card").on("click", function () {
    let imgSrc = $(this).attr("data-image");
    let caption = $(this).attr("data-room");

    $.fancybox.open([
      { src: imgSrc, opts: { caption: caption } }
    ], {
      buttons: ["zoom", "close"],
      loop: true
    });
  });

  // Initialize Swiper
  var swiper = new Swiper('.swiper-container', {
    slidesPerView: 3,
    spaceBetween: 20,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    },
    breakpoints: {
      768: { slidesPerView: 2 },
      576: { slidesPerView: 1 }
    }
  });
});