'use strict'

const User = require("../models/user-model")
const express = require("express")
const authentication = require("../middleware/authentication")

const router = new express.Router()


//Challange friend to play
router.post("/game/challangeFriend",authentication,async (req,res)=>{
    const friendUsername = req.body.username
    try{  
        await req.user.challangeFriend(friendUsername)
        res.send()
    }catch(e){
        res.status(400).send()
    }
})

router.post("/game/acceptChallange",authentication,async (req,res)=>{
    const friendUsername = req.body.username
    try{    
        await req.user.acceptChallange(friendUsername)
        res.send()
    }catch(e){
        res.status(400).send()
    }
})

router.post("/game/rejectChallange",authentication,async (req,res)=>{
    const friendUsername = req.body.username
    try{    
        await req.user.rejectChallange(friendUsername)
        res.send()
    }catch(e){
        res.status(400).send()
    }
})

router.post("/game/endGame",authentication,async (req,res)=>{
    const friendUsername = req.body.username
    console.log("end game: ", req.user.name,req.body.username);
    try{
        //do some stuff about winning game etc
        await req.user.endGame(friendUsername)
        res.send("User who wins: blank")
    }catch(e){
        res.status(400).send()
    }
})

module.exports = router