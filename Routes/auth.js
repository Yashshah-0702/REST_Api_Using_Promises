const express = require("express");
const { body } = require("express-validator");
const User = require("../models/user");
const auth = require('../Controller/auth')

const router = express.Router();

router.put("/signup", [
  body("email")
    .isEmail()
    .withMessage("plz enter a valid email...")
    .custom((value, { req }) => {
        return User.findOne({email:value}).then(userDoc=>{
            if(userDoc){
               return Promise.reject("Email already exists..")
            }
        })
    }).normalizeEmail(),
    body("password").trim().isLength({min:5}),
    body("name").trim().not().isEmpty()
],auth.SignUp);

router.post('/login',auth.Login)

module.exports = router;
