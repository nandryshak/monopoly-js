function init() {
    var serverBaseUrl = document.domain;

    // On client init, try to connect to the socket.io server.
    var socket = io.connect(serverBaseUrl);

    var sessionId = '';

    function updateParticipants(participants) {
        $('#participants').html('');
        for (var i = 0; i < participants.length; i++) {
            $('#participants').append('<span id="' + participants[i].id + '">' +
                                     participants[i].name + ' ' + 
                                     (participants[i].id === sessionId ? '(You)' : '') + 
                                     '<br /></span>');
        }
    }

    // when the client first connects
    socket.on('connect', function() {
        sessionId = socket.io.engine.id;
        console.log('Connected ' + sessionId);
        socket.emit('newUser', {id: sessionId, name: $('#name').val()});
    });

    // when somebody else connects
    socket.on('newConnection', function(data) {
        updateParticipants(data.participants);
    });

    // when somebody disconnects
    socket.on('userDisconnected', function(data) {
        $('#' + data.id).remove();
    });

    // when somebody changed their name
    socket.on('nameChanged', function(data) {
        $('#' + data.id).html(data.name + ' ' + (data.id === sessionId? '(You)' : '') + '<br/>');
    });

    // when the client receives a message
    socket.on('incomingMessage', function(data) {
        var message = data.message;
        var name = data.name;
        $('#messages').prepend('<strong>' + name + '</strong>' + 
                               '<br/>' + message + '<hr/>');
    });

    // error
    socket.on('error', function(reason) {
        console.log('Unable to connect to server: ', reason);
    });

    function sendMessage() {
        var outgoingMessage = $('#outgoing-message').val();
        var name = $('#name').val();
        $.ajax({
            url: '/message',
            type: 'POST',
            dataType: 'json',
            data: {message: outgoingMessage, name: name}
        });
    }

    function outgoingMessageKeyDown(event) {
        if (event.which == 13) {
            event.preventDefault();
            if ($('#outgoing-message').val().trim().length <= 0) {
                return;
            }
            sendMessage();
            $('#outgoing-message').val('');
        }
    }

    function outgoingMessageKeyUp() {
        var outgoingMessageValue = $('#outgoing-message').val();
        $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
    }

    function nameFocusOut() {
        var name = $('#name').val();
        socket.emit('nameChange', {id: sessionId, name: name});
    }

    $('#outgoing-message').on('keydown', outgoingMessageKeyDown);
    $('#outgoing-message').on('keyup', outgoingMessageKeyUp);
    $('#name').on('focusout', nameFocusOut);
    $('#send').on('click', sendMessage);

}

$(document).on('ready', init);










