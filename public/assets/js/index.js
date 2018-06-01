$(document).ready(function(){
    $('.carousel').carousel();
    
  });

var alert = document.getElementById("alert");

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
    }
    console.log(newTrip)
    $.post('/newtrip', newTrip).then(function () {
    })
})

function getLocation () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
        
    } else { 
        alert.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition (position) {
    // console.log(user.uid)

    var location = {
        lat: position.coords.latitude,
        long: position.coords.longitude
    }

    $.post('/checkin', location).then(function () {
    })
}

$('.submit').on('click', function (e) {  
    e.preventDefault();

    var location = {
        venue: $('#venue').val().trim(),
        city: $('#city').val().trim()
    }
    $.post('/checkin', location).then(function () {
    })

})