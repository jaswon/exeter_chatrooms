var request = require("request")
var cheerio = require("cheerio");
var LocalStrategy = require('passport-local').Strategy;


module.exports = function(passport) {
    passport.use('local',new LocalStrategy({
        usernameField: 'user',
        passwordField: 'pass'
    }, function(user, pass, done) {
        request.post({
            rejectUnauthorized: false,
            url: "https://csserver.exeter.edu/schedule/account.php",
            form: {
                username: user,
                password: pass
            }
        }, function(err,httpres,body){
            if (err) {
                res.send(err);
            } else {
                $ = cheerio.load(body);
                var auth = $('#status').text()
                if ("You are logged in as ." === auth) {
                    return done(null, {
                        user: user,
                        pass: pass
                    })
                } else {
                    return done(null, false, {message: 'invalid credentials'})
                }
            }
        })
    }));

    passport.serializeUser(function(user, done) {
      done(null, user);
    });

    passport.deserializeUser(function(user, done) {
      done(null, user);
    });
}
