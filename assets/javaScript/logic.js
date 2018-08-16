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

//State flags for waiting for chat to load, auto-scrolling when scrolled to bottom, and stopping auto-scroll when manually scrolled up.
var chatLoad = false;
var scrollState = false;

var funcs = {
  getUserFlag: function () {
    // get the API result via jQuery.ajax
    $.ajax({
      url:
        'https://api.ipdata.co?api-key=707bc514910151f8dac000c65049abe79a8398dadfb2943e6582e494'
    }).then(function (res) {
      var flag = `<img src=${res.flag}>`;
      currentUserFlag = flag;

      database
        .ref('usersOnline/' + currentUserKey + '/flag')
        .set(res.flag);
    });
  },
  addMessage: function (messageString) {

    var date = moment().format("MMM-Do-YYYY, HH:mm");

    mainChatRef.push({
      sender: currentUserName,
      message: messageString,
      time: date
    });
  },
  msgHandler: function (messageString) {
    var prefix = '!';
    var msgArray = _.split(messageString, ' ');
    var command = _.pullAt(msgArray, [0])[0];
    var searchTerm = _.map(msgArray).join(' ');
    var gifURL = `https://api.giphy.com/v1/gifs/random?tag=${searchTerm}&api_key=AsxtYL8Ch0dzfD1ekjuC36EWxoUEwsw9&limit=1`;
    var translateURL = `https://api.mymemory.translated.net/get?q=${searchTerm}&langpair=en|`

    //Strings broken into vars to help the !help command not look like poo.
    var helpGif = 'Use "!gif [search term]" to post a random gif with the specified tag.  Example: !gif happy';
    var helpItalian = 'Use "!italian [sentence]" to translate what you type into Italian. Example: !italian Does it walk like a duck?';
    var helpJapanese = 'Use "!japanese [sentence]" to translate what you type into Japanese. Example: !japanese Does it quack like a duck?';
    var helpSwahili = 'Use "!swahili [sentence]" to translate what you type into Swahili. Example: !swahili What the duck?';
    var helpDuck = 'Use "!duck" for an increasing flock of duck emojis. Example: !duck';

    //if first word starts with prefix, handle the command.
    //if first word doesn't start with prefix, push the message.
    if (_.startsWith(command, prefix)) {
      switch (command) {
        case '!help':
          funcs.addMessage(`<p>${helpGif}</p><p>${helpDuck}</p><p>${helpItalian}</p><p>${helpJapanese}</p><p>${helpSwahili}</p>`);
          break;

        case '!gif':
          $.ajax({
            url: gifURL
          }).then(function (res) {
            var gif = res.data.images.fixed_width.url;
            funcs.addMessage(`<img src=${gif}>`);
          });
          break;

        case '!italian':
          $.ajax({
            url: translateURL + "it"
          }).then(function (res) {
            funcs.addMessage(res.responseData.translatedText);
          });
          break;

        case '!japanese':
          $.ajax({
            url: translateURL + "ja"
          }).then(function (res) {
            funcs.addMessage(res.responseData.translatedText);
          });
          break;

        case '!swahili':
          $.ajax({
            url: translateURL + "sw"
          }).then(function (res) {
            funcs.addMessage(res.responseData.translatedText);
          });
          break;

        case '!duck':
          var duckCount = parseInt(searchTerm);
          var duckArr = [];
          if (!isNaN(duckCount)) {
            if (duckCount <= 50) {
              for (var i = 0; i < duckCount; i++) {
                duckArr.push(String.fromCodePoint(0x1F986));
              }
              funcs.addMessage(_.map(duckArr).join(' '));
            } else {
              funcs.addMessage("Come on, that's too many ducks.");
            }
          } else {
            funcs.addMessage('No ducks found! Make sure you are entering a number.');
          }
          break;

        default:
          funcs.addMessage('Command not found! Use !help for command help.');
          break;
      }
    } else { //if no command is found, display message as typed
      funcs.addMessage(messageString);
    }

    //empty out the input box after the stuff is finished
    $('#input-message').val('');
  },
  themeSwitch: function (chosenTheme) {
    var theme = $('#theme');

    localStorage.clear();
    localStorage.setItem('theme', chosenTheme);

    var storedTheme = localStorage.getItem('theme');
    theme.attr('href', `assets/css/${storedTheme}.css`);
  },
  themeGet: function () {
    var theme = $('#theme');
    var storedTheme = localStorage.getItem('theme');

    if (storedTheme) {
      theme.attr('href', `assets/css/${storedTheme}.css`);
    }
  },
  displayUser: function (name, key, flag) {
    var userDiv = $("<div>");
    userDiv.attr("data-key", key);

    console.log("displayUser flag " + flag);

    userDiv.html("<img src=" + flag + ">" + " " + name);
    $("#activeUsers").append(userDiv);
  }
};

// This checks when the number of connections changes.
connectedRef.on('value', function (snapshot) {
  // When they are connected
  if (snapshot.val()) {
    // User gets added to online users
    var connected = usersOnlineRef.push({
      name: 'unknown', //starts as unknown
      flag: 'assets/images/unknown-flag.png', //placeholder for later features
      key: 'futureKey', //placeholder for key (This is important for removing offline users from users online)     
    });


    // Store the "key" to the current user
    currentUserKey = connected.key;

    database
      .ref('usersOnline/' + currentUserKey + '/key')
      .set(currentUserKey);

    // Remove user and their data from the onlineUsers when disconnected

    connected.onDisconnect().remove();
  }
});



//function that checks for new messages and runs when the page is loaded
mainChatRef.limitToLast(50).on('child_added', function (snapshot) {
  //create a div to show the message
  var $messageDiv = $('<div>').html(
    `
    <div class="messagePost container">
      
      <div class="row justify-content-between"> 
        <div class="col align-self-start">
          ${snapshot.val().sender} 
        </div>
        <div class="col-sm-3">
          ${snapshot.val().time}
        </div>
      </div>

      <hr>  

      <div class="row container">
        ${snapshot.val().message}
      </div>

    </div>
    `
  );

  //Append the single message to the chat log
  $('#chatlog').append($messageDiv);

  //controls timeout for scrolling depending on if the page has loaded and if the scroll bar is at the bottom.
  if (!scrollState) {
    if (!chatLoad) {
      setTimeout(() => {
        $('#chatlog')
          .stop()
          .animate({ scrollTop: $('#chatlog')[0].scrollHeight }, 200);
      }, 200);
      chatLoad = true;
    } else {
      setTimeout(() => {
        $('#chatlog')
          .stop()
          .animate({ scrollTop: $('#chatlog')[0].scrollHeight }, 200);
      }, 50);
    }
  }

});


//listens for user manually scrolling up
$('#chatlog').scroll(function () {
  var scrollTop = $('#chatlog').scrollTop();
  var scrollHeight = $('#chatlog')[0].scrollHeight;
  var clientHeight = $('#chatlog')[0].clientHeight;

  //when user scrolls, enter scroll state. When user scrolls back down to bottom, exit scroll state and continue auto-scrolling.
  if (!scrollState) {
    scrollState = true;
  } else if (scrollHeight - scrollTop === clientHeight) {
    scrollState = false;
  }
});


//Function called when post message button is clicked.
$('#postMessage').on('click', function (event) {
  event.preventDefault();

  if ($('#input-message').val()) {
    //Calls function that creates the message
    funcs.msgHandler($('#input-message').val());

    //Clears input field for next message.
    $('#input-message').val('');
  }
});

//function to choose your username
$('#userChoice').on('click', function (event) {
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
  }

  funcs.getUserFlag();

});

//Detects when a new user comes online.
usersOnlineRef.on('child_added', function (snapshot) {
  funcs.displayUser(snapshot.val().name, snapshot.key, snapshot.val().flag);
})

//Detects when a user changes (name).  Removes old div and puts it in a new one.
usersOnlineRef.on('child_changed', function (snapshot) {
  $('[data-key="' + snapshot.val().key + '"]').remove();
  funcs.displayUser(snapshot.val().name, snapshot.key, snapshot.val().flag);
})

//Detects when a uesr goes offline.  Removes div.
usersOnlineRef.on('child_removed', function (snapshot) {
  $('[data-key="' + snapshot.val().key + '"]').remove();
})

//Theme chooser click function
$('.themeBtn').click(function () {
  event.preventDefault();

  var chosenTheme = $(this).attr('data-theme');

  funcs.themeSwitch(chosenTheme);
});


//Set color scheme to last chosen theme
funcs.themeGet();