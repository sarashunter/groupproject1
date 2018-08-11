// Initialize Firebase
var config = {
  apiKey: 'AIzaSyCruCRfWLwoPUYABBuq_YVrCh1BGLPR1OE',
  authDomain: 'project1-4ed1c.firebaseapp.com',
  databaseURL: 'https://project1-4ed1c.firebaseio.com',
  projectId: 'project1-4ed1c',
  storageBucket: 'project1-4ed1c.appspot.com',
  messagingSenderId: '24055026065'
};
firebase.initializeApp(config);

var database = firebase.database();

//This could potentially hold more than one chat in the future.
var chatsRef = database.ref('/chats');

//Only chat for now.
var mainChatRef = database.ref('/chats/mainChat');

//Holds the user information for current connections.  Users get deleted when they get disconnected.
var usersOnlineRef = database.ref('/usersOnline/');

//Built in Firebase feature that detects user connections.  Used to tell when users are on.
var connectedRef = database.ref('.info/connected');

//This will store the key to the user so other information about the user can be accessed later.
var currentUserKey;

//This is the current username.  This is for ease of use and gets valued when a username is chosen.
var currentUserName;

//Will display country flag.
var currentUserFlag;

var funcs = {
  getUserFlag: function() {
    var access_key = '59bbc530a4a2a267287e5dc9526d899e';

    // get the API result via jQuery.ajax
    $.ajax({
      url: 'https://api.ipstack.com/check?access_key=' + access_key,
      dataType: 'jsonp',
      success: function(json) {
        // output the "country flag" object inside "location"
        currentUserFlag = json.location.country_flag;
      }
    });
  },
  addMessage: function(messageString) {
    mainChatRef.push({
      sender: currentUserName,
      message: messageString,
      time: 'now'
    });
  },
  msgHandler: function(messageString) {
    var prefix = '!';
    var msgArray = _.split(messageString, ' ');
    var command = _.pullAt(msgArray, [0])[0];
    var searchTerm = _.map(msgArray).join(' ');
    var gifURL = `https://api.giphy.com/v1/gifs/random?tag=${searchTerm}&api_key=AsxtYL8Ch0dzfD1ekjuC36EWxoUEwsw9&limit=1`;

    //if first word starts with prefix, handle the command.
    //if first word doesn't start with prefix, push the message.
    //AJAX call would go here?
    if (_.startsWith(command, prefix)) {
      if (command === '!help') {
        console.log(
          '!gif [searchTerm] for pulling a random gif with that tag.'
        );
      } else if (command === '!gif') {
        $.ajax({
          url: gifURL
        }).then(function(res) {
          var gif = res.data.fixed_width_small_url;
          funcs.addMessage(`<img src=${gif}>`);
        });
      } else {
        console.log('Command not found!\nType !help for commands.');
      }
    } else {
      funcs.addMessage(messageString);
    }

    //empty out the input box after the stuff is finished
    $('#input-message').val('');
  }
};

// This checks when the number of connections changes.
connectedRef.on('value', function(snapshot) {
  // When they are connected
  if (snapshot.val()) {
    // User gets added to online users
    var connected = usersOnlineRef.push({
      name: 'unknown', //starts as unknown
      location: 'usa' //placeholder for later features
    });

    // Store the "key" to the current user
    currentUserKey = connected.key;

    // Remove user and their data from the onlineUsers when disconnected

    connected.onDisconnect().remove();
  }
});

//function that checks for new messages and runs when the page is loaded
mainChatRef.on('child_added', function(snapshot) {
  //create a div to show the message
  var $messageDiv = $('<div>').html(
    snapshot.val().sender + ': ' + snapshot.val().message
  );

  //Append the single message to the chat log
  $('#chatlog').append($messageDiv);
});

//Function called when post message button is clicked.
$('#postMessage').on('click', function(event) {
  event.preventDefault();

  if ($('#input-message').val()) {
    //Calls function that creates the message
    funcs.msgHandler($('#input-message').val());

    //Clears input field for next message.
    $('#input-message').val('');
  }
});

//function to choose your username
$('#userChoice').on('click', function(event) {
  event.preventDefault();

  //Store the value of the username chosen by user.  Probably want to validate this against other users.
  currentUserName = $('#chooseUser').val();

  if (currentUserName) {
    //Set the name of the current user in user object to user's input.
    database
      .ref('usersOnline/' + currentUserKey + '/name')
      .set(currentUserName);

    //Remove username input box after username is chosen

    // TODO: change display state of #userCreate to hidden and messages to inline-block
    $('#enterUser').empty();

    //Probably want to add our chat box at this point rather than from the start.

    funcs.getUserFlag();
  }
});
