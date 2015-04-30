// SERVER INIT
// -----------
var soap         = require("soap")
var cParser      = require("cookie-parser")
var bodyParser   = require("body-parser");
var flash        = require('connect-flash');
var express      = require('express.io')
var app          = express()
var passport     = require("passport")
var session      = require("express-session")
var rStore       = require('connect-redis')(session);
var passSocket   = require("passport.socketio");
var redis        = require("redis").createClient(13460 ,'pub-redis-13460.us-east-1-2.2.ec2.garantiadata.com');

redis.auth(ENV['REDIS_PASS'], function() {
    console.log("cool")
})

var sessionStore = new rStore({
    client: redis
})

app.http().io()

require('./passport')(passport);

app.set('secret',ENV['SESSION_SECRET'])

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(flash());
app.use(session({
    store: sessionStore,
    secret: app.get('secret')
}))
app.use(passport.initialize());
app.use(passport.session())

app.io.set('authorization', passSocket.authorize({
    key:        'connect.sid',       //the cookie where express (or connect) stores its session id.
    secret:     app.get('secret'),
    store:      sessionStore
}));


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/login');
}

// SOCKET.IO routes
// ----------------

app.io.route('ready', function(req) {
    if (req.handshake.user.user == req.data.user) {
        req.io.join(req.data.room)
        app.io.room(req.data.room).broadcast('announce', {
            message: '<span title="' + req.handshake.user.user + '">' + req.data.name + '</span> has joined.'
        })
    }
})

app.io.route('logout', function(req) {
    if (req.handshake.user.user == req.data.user) {
        req.io.leave(req.data.room)
        app.io.room(req.data.room).broadcast('announce', {
            message: '<span title="' + req.handshake.user.user + '">' + req.data.name + '</span> has left.'
        })
    }
})

app.io.route('message', function(req) {
    if (req.handshake.user.user == req.data.user) {
        app.io.room(req.data.room).broadcast('message', {
            user: req.handshake.user.user,
            name: req.data.name,
            data: req.data.data
        })
    }
})

// GET/POST routes
// ---------------

app.get('/', function(req, res) {
    res.redirect("/rooms")
});

app.get('/login', function(req, res) {
    res.render('login.ejs', { message: req.flash('error') });
});

app.post('/login', passport.authenticate('local',
    {
        successRedirect: '/rooms',
        failureRedirect: '/login',
        failureFlash : true
    }
));

app.get('/rooms', isLoggedIn, function(req,res) {
    soap.createClient('https://connect.exeter.edu/student/_vti_bin/UserProfileService.asmx?WSDL',{
        wsdl_headers: {
            Authorization: "Basic " + new Buffer( req.user.user + "@exeter.edu:" + req.user.pass).toString("base64")
        }
    },function(err,client) {
        if (err) {
            res.send(err);
        } else {
            client.setSecurity(new soap.BasicAuthSecurity("master\\"+req.user.user,req.user.pass));
            client.GetUserProfileByName(function(err1, result){
                if (err1) {
                    res.send(err1.response.body)
                } else {
                    var suds = result.GetUserProfileByNameResult.PropertyData;
                    for (var k in suds) {
                        var obj = suds[k];
                        if ("Courses" == obj["Name"]) {
                            if (obj["Values"]["ValueData"]) {
                                var vdata = obj["Values"]["ValueData"]
                                for (var j in vdata) {
                                    vdata[j] = vdata[j]["Value"]["$value"]
                                }
                                if (1 == vdata.length) {
                                    vdata = vdata[0];
                                }
                                //res.send(vdata);
                                res.render('rooms.ejs', {rooms: vdata, user: req.user.user})
                            }
                        }
                    }
                }
            })
        }
    })
})

app.get('/rooms/:room', isLoggedIn, function(req,res) {
    //res.send(req.params.room);
    res.render('room.ejs', {room: req.params.room, user: req.user.user})
});

// START SERVER
// ------------

app.listen(process.env.PORT || 80)
