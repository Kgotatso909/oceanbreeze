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
});
