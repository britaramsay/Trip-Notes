var config = {
    apiKey: "AIzaSyBZiXZsjYUKoGS_jO-Fn_O5Ji5onyDOCaw",
    authDomain: "trip-notes-428fb.firebaseapp.com",
    projectId: "trip-notes-428fb",
};
firebase.initializeApp(config);

function onSignIn(googleUser) {
    // Google idtoken
    var id_token = googleUser.getAuthResponse().id_token

    // Build Firebase credential with the Google ID token.
    var credential = firebase.auth.GoogleAuthProvider.credential(id_token);

    // Firebase idtoken
    var idToken = credential.idToken

    // Sign in with credential from the Google user.
    firebase.auth().signInAndRetrieveDataWithCredential(credential).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
    });
}

function signOut() {
    // Signout with firebase
    firebase.auth().signOut().then(function () {
        var auth2 = gapi.auth2.getAuthInstance();

        // Have to sign out with google too or user will be signed in on reload
        auth2.signOut().then(function () {
            console.log('User signed out.');
        });
        // Sign-out successful.
    }).catch(function (error) {
        // An error happened.
    });
}


firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        // Show signout button when signed in
        $('.g-signout2').show()
        $('#dashboard-btn').show()
        // User is signed in.
        var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
        var providerData = user.providerData;

        // find or create user
        $.ajax('/user/' + uid, { type: 'GET' }).then(function (data) {
            $('#username').text(displayName);
            $('#email').text(email);
            $('#userlogo').attr('src', photoURL)
        });


    } else {
        // User is signed out. Hide signout button
        $('.g-signout2').hide()
        $('#dashboard-btn').hide()
    }
});