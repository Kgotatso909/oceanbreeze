$(document).ready(function() {
    $('.paroller-image img').paroller({
        factor: 0.5, 
        type: 'foreground',
        direction: 'horizontal' 
    });

  
    $('.paroller-image-second img').paroller({
        factor: 0.5,  
        type: 'foreground',
        direction: 'horizontal' 
    });

    $('.hero-image').paroller({
        factor: 0.3, // Slower scrolling effect for the background image
        type: 'background', // Parallax effect applied to the background of the image
        direction: 'vertical' // Scroll direction is vertical
      });
});
