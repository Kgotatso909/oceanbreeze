document.addEventListener("DOMContentLoaded", function () {
    // Initialize check-in date picker
    const checkInPicker = flatpickr("#inputCheckIn", {
        minDate: "today",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr, instance) {
            // Update the minDate of check-out based on the selected check-in date
            checkOutPicker.set('minDate', selectedDates[0]);
        }
    });

    // Initialize check-out date picker
    const checkOutPicker = flatpickr("#inputCheckOut", {
        minDate: "today",
        dateFormat: "Y-m-d",
        disable: [
            function (date) {
                return date < new Date(document.getElementById('inputCheckIn').value);
            }
        ]
    });
});
