//jshint esversion:6

require('dotenv').config();
const body_parser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(body_parser.urlencoded({
    extended: true
}));

app.use(session({
    secret:'Our little Secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://127.0.0.1:27017/userDB');
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    googleEmail: String,
    facebookId: String,
    facebookEmail: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model('User', userSchema);


passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
    // In this example, we'll just serialize the user's ID
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    // In this example, we'll just deserialize the user's ID
    const user = { id }; // Replace with your own logic to fetch user data from a database
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_CLIENTSECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({username: profile.displayName, googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENTID,
    clientSecret: process.env.FACEBOOK_CLIENTSECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));

// home routes
app.route('/')
.get(function(req, res){
    res.render('home');
});
// auth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });
  app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
// secrets routes
app.route('/secrets')
.get(function(req, res){
    User.find({secret: {$ne: null}})
    .then(function(foundUsers){
        if(req.isAuthenticated()){
            res.render('secrets', {users: foundUsers});
        }else{
            res.redirect('/login');
        };
    })
    .catch(function(err){
        console.log('Error Occured: ', err.message);
    });
});


// submit secret routes
app.route('/submit')
.get(function(req, res){
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect('/login');
    };
})
.post(function(req, res){
    User.findByIdAndUpdate(req.user.id, { $set: { secret: req.body.secret }})
    .then(function(success){
        console.log('Updated and secret Added');
    });
    res.redirect('/secrets');
});
// register routes
app.route('/register')
.get(function(req,res){
    if(req.isAuthenticated()){
        res.redirect('/secrets');
    }else{
    res.render('register');
    };
})
.post(function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate('local')(req, res,function(){
                res.redirect('/secrets');
            });
        };
    });
});

// login routes
app.route('/login')
.get(function(req, res){
    if(req.isAuthenticated()){
        res.redirect('/secrets');
    }else{
    res.render('login');
    };
})
.post(function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.logIn(user, function(err){
        if(err){
            console.log('Error Occured: ', err.message);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect('/secrets');
            });
        };
    });
});

// logout routes
app.route('/logout')
.get(function(req, res){
    req.logOut(function(err){
        if (err){
            console.log(err);
        }else{
            res.redirect('/');
        };
    });
});
    
// listening to port 3000
app.listen(3000, function(){
    console.log('Server started on port 3000.');
});