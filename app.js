//jshint esversion:6
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-Parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportlocalMongoose = require("passport-local-mongoose");
app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.set("view engine", "ejs");
app.use(express.static("public"));

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String,
});
userSchema.plugin(passportlocalMongoose);

const userModel = new mongoose.model("user", userSchema);
passport.use(userModel.createStrategy());

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());
app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});
app.get("/logout", (req, res) => {
    res.redirect("/");
});
app.get("/register", (req, res) => {
    res.render("register.ejs");
});
app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        userModel.find({ secret: { $ne: null } }, (err, foundUser) => {
            res.render("secrets.ejs", { userWithSecrets: foundUser });
        });
    } else {
        res.redirect("/login");
    }
});
app.post("/register", function (req, res) {
    userModel.register(
        { username: req.body.username },
        req.body.password,
        function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        }
    );
});

app.post("/login", (req, res) => {
    const user = new userModel({
        username: req.body.username,
        password: req.body.password,
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});
app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit.ejs");
    } else {
        res.redirect("/login");
    }
    app.post("/submit", (req, res) => {
        var submittedSecret = req.body.secret;
        userModel.findById(req.user.id, (err, foundUser) => {
            if (err) {
                console.log(err);
            } else {
                foundUser.secret = submittedSecret;
                foundUser.save((err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect("/secrets");
                    }
                });
            }
        });
    });
});
app.post("/logout", (req, res) => {
    req.logOut();
});
app.listen(3000, function () {
    console.log("server starting at port 3000");
});