io = io.connect()
var handle;
do {
    handle = prompt('Choose an identifier (hovering over this will display your exeter username)')
    if (!handle) {
        window.location = "/rooms/"
    }
} while ("" == handle);
// Emit ready event with room name.
io.emit('ready', {
    room: "<%= room %>",
    name: handle,
    user: "<%= user %>"
})
// Listen for the announce event.
io.on('announce', function(data) {
    $('ul').append('<li class="alert"> ' + data.message + '</li>')
})

io.on('message', function(data) {
    $('ul').append('<li><span title="' + data.user + '">' + data.name + '</span>: ' + data.data + '</li>')
})
