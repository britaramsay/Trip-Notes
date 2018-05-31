function getLocation(e) {
    e.preventDefault();
    var alert = document.getElementById("alert");

    if (navigator.geolocation) {
        var loca = navigator.geolocation.getCurrentPosition(showPosition);
        console.log(loca)
        
    } else { 
        alert.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    var alert = document.getElementById("alert");

    var location = position.coords.latitude +','+ position.coords.longitude;
    alert.innerHTML = '<p>'+location+'</p>'
}