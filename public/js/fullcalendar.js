
        document.addEventListener('DOMContentLoaded', function() {
            var calendarEl = document.getElementById('calendar');

            var calendar = new FullCalendar.Calendar(calendarEl, {
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek,dayGridDay'
                },
                initialView: 'dayGridMonth',
                events: function(info, successCallback, failureCallback) {
                    // Use AJAX to fetch the availability data
                    var roomNumber = '101';  // Example room number
                    var year = new Date().getFullYear();
                    var month = new Date().getMonth() + 1;

                    // AJAX request to fetch the room availability data
                    fetch(`/availability?roomNumber=${roomNumber}&year=${year}&month=${month}`)
                        .then(response => response.json())
                        .then(data => {
                            // Format the data into the FullCalendar events format
                            var events = [];
                            
                            data.availableDates.forEach(date => {
                                events.push({
                                    title: 'Available',
                                    start: date,
                                    end: date,
                                    className: 'fc-event-available'
                                });
                            });
                            
                            data.unavailableDates.forEach(date => {
                                events.push({
                                    title: 'Booked',
                                    start: date,
                                    end: date,
                                    className: 'fc-event-unavailable'
                                });
                            });

                            successCallback(events);
                        })
                        .catch(error => {
                            console.error('Error fetching data:', error);
                            failureCallback(error);
                        });
                },
                eventClick: function(info) {
                    alert('Event: ' + info.event.title + '\n' + 'Date: ' + info.event.start.toLocaleString());
                }
            });

            calendar.render();
        });
   