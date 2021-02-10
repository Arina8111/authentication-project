//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-Parser");
const ejs = require("ejs");
const encrypt = require("mongoose-encryption")
const mongoose = require("mongoose")
const app = express();
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.set("view engine", "ejs");
app.use(express.static("public"));
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

// userSchema.plugin(encrypt,({ secret: encryptionKey, encryptedFeilds: ["password"] }))
const encryptionKey = process.env.SECRET
userSchema.plugin(encrypt, { secret: encryptionKey, encryptedFeilds: ['password'], excludeFromEncryption: ["email"] });
const userModel = new mongoose.model("user", userSchema)
app.get("/", (req, res) => {
    res.render("home.ejs")
})

app.get("/login", (req, res) => {
    res.render("login.ejs")
})

app.get("/register", (req, res) => {
    res.render("register.ejs")
})

app.post("/register", (req, res) => {
    const user = new userModel({
        email: req.body.username,
        password: req.body.password
    })
    user.save((err) => {
        if (err) {
            console.log(err);
        } else (res.render("secrets.ejs"))
    })
})

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    userModel.find({ email: username }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.forEach(pass => {
                    if (pass.password === password) {
                        res.render("secrets.ejs")
                    }
                });

            }
        }
    })
})
app.listen(3000, function () {
    console.log("server starting at port 3000");
});
