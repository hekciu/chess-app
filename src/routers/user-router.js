'use strict'

const express = require("express")

const router = new express.Router()
const User = require("../models/user-model")
const authentication = require("../middleware/authentication")

//Creating new account
router.post("/users", async (req,res)=>{
    try{
        const user = new User(req.body)
        const token = await user.generateAuthToken()
        res.status(201).send({
            user: await user.getPublicProfile(),
            token
        })
    }catch(e){
        res.status(400).send(e.message)
    }
})

//Login into application
router.post("/users/login", async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({
            user: await user.getPublicProfile(),
            token
        })
    }catch(e){
        res.status(400).send(e.message)
    }
})

//Getting my profile 
router.get("/users/me",authentication,async (req,res)=>{
    try{
        const user = await req.user.getPublicProfile()
        res.send(user)
    }catch(e){
        res.status(400).send(e.message)
    }
})

//Logging out
router.post("/users/logout",authentication,async (req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=> token.token !== req.token)
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send(e.message)
    }
})

//Logging out from all sessions
router.post("/users/logoutAll",authentication,async (req,res)=>{
    try{
        req.user.tokens = [];
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send(e.message)
    }
})

//Get my account details
router.get("/users/me",authentication, async (req,res)=>{
    try{
        res.send({
            user: await req.user.getPublicProfile()
        })
    }catch(e){
        res.status(400).send(e.message)
    }
})

//Changing user data
router.patch("/users/me",authentication, async (req,res)=>{
    const allowedUpdatesUser = ["name","password","email"]
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((el)=>{
        return allowedUpdatesUser.includes(el)
    })
    if(!isValidOperation){
        res.status(400).send({
            error: "Invalid updates"
        })
        return;
    }
    try{
        updates.forEach((update)=>{
            req.user[update] = req.body[update]
        })
        await req.user.save()
        res.send(req.user.getPublicProfile())
    }catch(e){
        res.status(500).send(e.message)
    }
})

//Deleting user
router.delete("/users/me",authentication,async (req,res)=>{
    try{
        await User.deleteOne({
            email: req.user.email
        })
        res.send()
    }catch(e){
        res.status(500).send(e.message)
    }
})

//Sending friend request
router.post("/users/requestFriend",authentication,async (req,res)=>{
    const friendUsername = req.body.username
    try{
        await req.user.sendFriendRequest(friendUsername)
        res.send()
    }catch(e){
        res.status(400).send()
    }
})

//Accepting friend requests
router.post("/users/acceptFriend",authentication,async (req,res)=>{
    const friendUsername = req.body.username
    try{
        await req.user.acceptFriendRequest(friendUsername)
        res.send()
    }catch(e){
        res.status(400).send()
    }
})

//Rejecting friend requests
router.post("/users/rejectFriend",authentication,async (req,res)=>{
    const friendUsername = req.body.username
    try{
        await req.user.rejectFriendRequest(friendUsername)
        res.send()
    }catch(e){
        res.status(400).send()
    }
})



module.exports = router