var notesModal;

$(document).ready(() => {
    //sideNav Bar
    try {
        $('.sidenav').sidenav('draggable', true);
    } catch (e) {
        // die silently
    }

    // Initialize carousel
    $('.carousel').carousel();

    // Initialize Modals
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems, { onOpenStart: onNotesModalOpen, onCloseEnd: onNotesModalClosed })
    var notesModalElement = document.querySelector('#noteModal');
    if (notesModalElement) {
        notesModal = M.Modal.getInstance(notesModalElement);
    }

    // Listen for a file to be uploaded
    $("#file-input").on('change', () => {
        const files = document.getElementById('file-input').files;
        const file = files[0];
        if (file == null) {
            M.toast({ html: 'No file selected' }, 4000)
        }
        getSignedRequest(file);
    }
    )
});

function onNotesModalOpen(modal, trigger) {
    $('#noteModal button').attr('data-key', $(trigger).attr('data-key'));
}

function onNotesModalClosed(modal) {
    $('#addNote').trigger('reset');
    $('#noteModal button').attr('data-key', '');
}

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        $.ajax('/user/trips', { type: 'GET' }).then(function (data) {
            $('#trips').html(data)
        })
    }
})

// Toggle show/hide new trip form
$('#newtrip-btn').on('click', function () {
    $('#newtrip-form').toggle()
})

$('#newtrip-form').submit(function (event) {
    event.preventDefault();

    var newTrip = {
        uid: firebase.auth().currentUser.uid,
        title: $('#title').val().trim(),
        description: $('#description').val().trim(),
        private: $('#private').is(":checked")
    };

    $.post('/newtrip', newTrip).then(function (data) {
        M.toast({ html: 'Trip "' + data.name + '" added' }, 4000);
        $('#trips').append(data.html);
        $('#newtrip-form').trigger('reset');

    });
});

$('#addNote').submit(function (event) {
    event.preventDefault();

    var note = {
        checkin: $('#noteModal button').attr('data-key'),
        note: $('#note').val().trim()
    };

    $.post('/note', note).then(function (data) {
        M.toast({ html: 'Note added' }, 4000);
        notesModal.close();

        $('.notes[data-key="' + data.checkinKey + '"]').append(data.html)
    });
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        M.toast({ html: 'Geolocation is not supported by this browser.' }, 4000)
    }
}

function showPosition(position) {
    var location = {
        trip: $('#tripKey').val(),
        lat: position.coords.latitude,
        long: position.coords.longitude
    };

    $.post('/checkin', location).then(function (data) {
        M.toast({ html: 'Checked in to ' + data.name }, 4000);
        $('#checkins').append(data.html);
        $('#checkinForm').trigger('reset');
    });
}

$('#checkinForm').submit(function (e) {
    e.preventDefault();

    var location = {
        trip: $('#tripKey').val(),
        venue: $('#venue').val().trim(),
        city: $('#city').val().trim()
    }

    $.post('/checkin', location).then(function (data) {
        M.toast({ html: 'Checked in to ' + data.name }, 4000);
        $('#checkins').append(data.html);
        $('#checkinForm').trigger('reset');
    })
})

$('.saveTrip').on('click', function () {
    var tripId = $(this).data('id')
    $.get('/user/' + firebase.auth().currentUser.uid).then(function (data) {
        $.post('/saveTrip', {
            trip: tripId,
            uid: data.id
        }, function (response) {
            M.toast({ html: 'Saved ' + response.TripId }, 4000)
        })
    })
})


function getSignedRequest(file) {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', `/sign-s3?file-name=${file.name}&file-type=${file.type}`);

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                console.log(response)
                // Post url to db
                $.ajax({
                    url: response.signedRequest,
                    type: 'PUT',
                    success: function () {
                        M.toast({ html: 'File uploaded' }, 4000)
                    }
                });
            }
            else {
                alert('Could not get signed URL.');
            }
        }
    };
    xhr.send();
}