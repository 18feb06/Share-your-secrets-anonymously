//jshint esversion:6

require('dotenv').config();
const body_parser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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

// 
mongoose.connect('mongodb://127.0.0.1:27017/userDB');
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', userSchema);

// 
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// home routes
app.route('/')
.get(function(req, res){
    res.render('home');
});
// secrets routes
app.route('/secrets')
.get(function(req, res){
    if(req.isAuthenticated()){
        res.render('secrets');
    }else{
        res.redirect('/login');
    }
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
    
// listening to port 3000
app.listen(3000, function(){
    console.log('Server started on port 3000.');
});