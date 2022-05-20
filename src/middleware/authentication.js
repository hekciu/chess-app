'use strict'

const jwt = require("jsonwebtoken")
const User = require("../models/user-model.js")

const authentication = async function(req,res,next){
    try{
        const token = req.header("Authorization").replace("Bearer ","")
        const decoded = jwt.verify(token,"temporary-secret-phrase")
        const user = await User.findOne({
            _id: decoded._id,
            "tokens.token": token
        })
        
        if(!user){
            throw new Error("Something went wrong during authentication...")
        }

        req.token = token;
        req.user = user;
        next()
    }catch(e){
        res.status(401).send({
            error: e.message
        })
    }
}


module.exports = authentication;