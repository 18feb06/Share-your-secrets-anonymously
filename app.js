//jshint esversion:6

const body_parser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');


const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(body_parser.urlencoded({extended: true}));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = 'It is my secret.';
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password']});
const User = mongoose.model('User', userSchema);

app.get('/', function(req, res){
    res.render('home');
});

app.get('/login', function(req, res){
    res.render('login');
});
app.post('/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username})
    .then(function(success){
        if (success){
            if (success.password === password){
                res.render('secrets');
            }else{
                res.send('Invalid Password');
            }
        }else{
            res.send('user not found');
        };
    })
    .catch(function(err){
        console.log('Error Occured: ', err.message)
    });
});

app.route('/register')
.get(function(req,res){
    res.render('register');
})
.post(function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    const newUser = new User({
        email: username,
        password: password
    });
    newUser.save()
    .then(function(success){
        res.render('secrets');
    })
    .catch(function(err){
        console.log('Error Occured: ', err.message);
    });
});



app.listen(3000, function(){
    console.log('Server started on port 3000.');
});