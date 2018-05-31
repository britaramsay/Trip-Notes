var alert = document.getElementById("alert");

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
        
    } else { 
        alert.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    var user = firebase.auth().currentUser;
    console.log(user.uid)

    var location = {
        lat: position.coords.latitude,
        long: position.coords.longitude
    }
    alert.innerHTML = '<p>'+location.lat+','+location.long+'</p>'

    $.post('/user', location).then(function() {
        console.log('hi')
    })
}

$('.submit').on('click', function (e) {  
    e.preventDefault();

    var location = {
        venue: $('#venue').val().trim(),
        city: $('#city').val().trim()
    }
    $.post('/user', location).then(function() {
        console.log('hi')
    })

    alert.innerHTML = '<p>'+venue+','+city+'</p>'
})