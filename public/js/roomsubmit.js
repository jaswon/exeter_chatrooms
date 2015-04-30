$('form').submit(function(){
    if ("" !== $('#m').val().replace(/^\s+|\s+$/g, '')) {
        io.emit('message', {
            room: "<%= room %>",
            name: handle,
            user: "<%= user %>",
            data: $('#m').val().replace(/^\s+|\s+$/g, '')
        });
        $('#m').val('');
    }
    return false;
});

$('#logout').click(function() {
    io.emit('logout', {
        room: "<%= room %>",
        name: handle,
        user: "<%= user %>"
    })
    window.location = "/rooms/";
    return true;
});
