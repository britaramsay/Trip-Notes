var notesModal;

$(document).ready(() => {


    // date picker
    $('.datepicker').datepicker();
    //sideNav Bar
    try {
        $('.sidenav').sidenav('draggable', true);
    } catch (e) {
        // die silently
    }

    // Initialize carousel


    // Initialize Modals
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems, { onOpenStart: onNotesModalOpen, onCloseEnd: onNotesModalClosed })
    var notesModalElement = document.querySelector('#noteModal');
    if (notesModalElement) {
        notesModal = M.Modal.getInstance(notesModalElement);
    }
});

$(document).on('click', '.delete', (event) => {
    $.ajax('/' + $(event.target).attr('data-type') + '/' + $(event.target).attr('data-key'), { type: 'DELETE' }).then(function (data) {
        $("#" + $(event.target).attr('data-key')).remove()
    }).fail(function (jqXHR, textStatus, errorThrown) {
        if (jqXHR.status == 401) {
            M.toast({ html: 'You are not authorized to delete this item' }, 4000)
        }
    });
});

// Listen for a file to be uploaded
$(document).on('change', 'input[type="file"]', (event) => {
    const files = event.target.files;
    const file = files[0];
    if (file == null) {
        M.toast({ html: 'No file selected' }, 4000);
    }
    else if (['png', 'jpg', 'jpeg'].indexOf(file.name.split('.').pop()) == -1) {
        M.toast({ html: 'Only images' }, 4000);
    }
    else {
        getSignedRequest(file, $(event.target).attr('data-key'));
    }

    // clear form
    $(event.target).val(null);
})

function onNotesModalOpen(modal, trigger) {
    $('#noteModal button').attr('data-key', $(trigger).attr('data-key'));
}

function onNotesModalClosed(modal) {
    $('#addNote').trigger('reset');
    $('#noteModal button').attr('data-key', '');
}

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        if(window.location.href.split('/').pop() == 'dashboard') {
            $.ajax('/user/trips', { type: 'GET' }).then(function (data) {
                $('#trips').html(data)
            })
        }
        else {
            $.ajax('/trips/public', { type: 'GET' }).then(function (data) {
                $('.carousel').html(data)
                $('.carousel').carousel({
                    onCycleTo: function(data) {
                        // id of current slide in carousel
                        var tripInfo = $(data).attr('id').split('/')

                        $('#currentTrip').html('<h4>'+tripInfo[1]+'</h4><p>'+tripInfo[2]+'</p>');
                        $('#currentTripLink').attr('href', '/trip/'+tripInfo[0])
                    }
                });
            })
        }
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

        $('#chooseLocation').html(data)

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
        // M.toast({ html: 'Checked in to ' + data.name }, 4000);
        // $('#checkins').append(data.html);
        // M.toast({ html: 'Checked into venue' }, 4000);
        $('#chooseLocation').append(data)
        // $('#checkins').append(data);
        $('#checkinForm').trigger('reset');
    });
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


function getSignedRequest(file, key) {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', `/sign-s3?file-name=${file.name}&file-type=${file.type}`);

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                var imgUrl = response.url;
                uploadFile(file, response.signedRequest, response.url, key)
            }
            else {
                alert('Could not get signed URL.');
            }
        }
    };
    xhr.send();
}

function uploadFile(file, signedRequest, url, key) {
    const options = {
        method: 'PUT',
        body: file
    };
    return fetch(signedRequest, options).then(response => {
        if (!response.ok) {
            throw new Error(`${response.status}: ${response.statusText}`);
        }
        M.toast({ html: 'File uploaded' }, 4000)

        $.post('/newImage', { url: url, checkin: key }).then(function (data) {
            $('.images[data-key="' + data.key + '"').append(data.html)
        })

        return url;
    });
}

$(document).on('click', '.locationBtn', function () {
    console.log()
    $.post('/checkinLocation', { location: $(this).attr('data-key'), trip: $('#tripKey').val() }).then((data) => {
        M.toast({ html: 'Checked in to ' + data.name }, 4000);
        $('#checkins').append(data.html);
        $('#chooseLocation').empty()
    })
})