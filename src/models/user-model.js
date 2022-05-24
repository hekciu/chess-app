'use strict'

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator")
const jwt = require("jsonwebtoken")
const authentication = require("../middleware/authentication")

const userScheme = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true,
        unique: true,
        dropDups: true
    },
    email:{
        type: String,
        required: true,
        trim: true,
        unique: true,
        dropDups: true,
        validate(val){
            if(validator.isEmail(val)) return true;
            throw new Error("Please insert valid email")
        }
    },
    password:{
        type: String,
        required: true,
        trim: true
    },
    points:{
        type: Number,
        default: 0 
    },
    currentlyPlayingWith:{
        type: String,
        default: ""
    },
    currentGameColor:{
        type: String
    },
    gameRequests:[{
        username:{
            type: String,
            required: true
        }
    }],
    friends:[{
        friendID:{
            type: mongoose.Types.ObjectId,
            required: true
        },
        username:{
            type: String,
            required: true
        }
    }],
    friendRequests:[{
        friendID:{
            type: mongoose.Types.ObjectId,
            required: true
        },
        username:{
            type: String,
            required: true
        }
    }],
    tokens:[{
        token:{
            type: String,
            required: true
        }
    }],
    currentGameChessMoves:{
        enemy:[{
            chessPiece:{
                type: String,
                required: true
            },
            whichField:{
                type: String,
                required: true
            }
        }],
        me:[{
            chessPiece:{
                type: String,
                required: true
            },
            whichField:{
                type: String,
                required: true
            }
        }]
    }
},{
    timestamps: true,
    dropDups: true
})

//methods available on the instance of user
userScheme.methods.generateAuthToken = async function(){
    const token = jwt.sign({
        _id: this._id.toString()
    },"temporary-secret-phrase")
    this.tokens = this.tokens.concat({
        token
    })
    await this.save();
    return token
}

userScheme.methods.getPublicProfile = async function(){
    const userObject = this.toObject()

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
}

userScheme.methods.sendFriendRequest = async function(username){
    const friend = await User.findOne({
        name: username
    })

    if(!friend){
        throw new Error("There is no user with given username!!")
    }
    if(friend._id.toString() === this._id.toString()){
        
        throw new Error("You can't send friend requests to yourself!!")
    }
    if(this.friends.filter((el)=>{
        return el.friendID.toString() === this._id.toString()
    }).length){
        throw new Error("You are already friends!!")
    }
    if(this.friendRequests.filter((el)=>{
        return el.friendID.toString() === friend._id.toString()
    }).length){
        throw new Error("This user already has send you friend request!!")
    }
    if(friend.friendRequests.filter((el)=>{
        return el.friendID.toString() === this._id.toString()
    }).length){
        throw new Error("You already has send friend request to this user!!")
    }
    friend.friendRequests = friend.friendRequests.concat({
        friendID: this._id,
        username: this.name
    })
    await friend.save()
}

userScheme.methods.acceptFriendRequest = async function(username){
    const friend = await User.findOne({
        name: username
    })
    if(!friend){
        throw new Error("There is no user with given username!!")
    }
    if(friend._id.toString() === this._id.toString()){
        throw new Error("You can't accept friend requests from yourself!!")
    }
    if(this.friends.filter((el)=>{
        return el.friendID.toString() === this._id.toString()
    }).length){
        throw new Error("You are already friends!!")
    }
    if(!this.friendRequests.filter((el)=>{
        return el.friendID.toString() === friend._id.toString()
    }).length){
        throw new Error("There is no user with given username in your friend requests!!")
    }
    this.friends = this.friends.concat({
        friendID: friend._id,
        username: friend.name
    })
    this.friendRequests = this.friendRequests.filter((el)=>{
        el.friendID !== friend._id
    })
    friend.friends = friend.friends.concat({
        friendID: this._id,
        username: this.name
    })
    await this.save()
    await friend.save()
}

userScheme.methods.rejectFriendRequest = async function(username){
    const friend = await User.findOne({
        name: username
    })
    if(!friend){
        throw new Error("There is no user with given username!!")
    }
    if(friend._id.toString() === this._id.toString()){
        throw new Error("You can't reject friend requests from yourself!!")
    }
    if(!this.friendRequests.filter((el)=>{
        return el.friendID.toString() === friend._id.toString()
    }).length){
        throw new Error("There is no user with given username in your friend requests!!")
    }
    this.friendRequests = this.friendRequests.filter((el)=>{
        el.friendID !== friend._id
    })
    await this.save()
}

//game
userScheme.methods.challangeFriend = async function(username){
    const friend = await User.findOne({
        name: username
    })
    if(!friend){
        throw new Error("Wrong username")
    }
    if(!this.friends.some((el)=>{
        return el.username === friend.name
    })){
        throw new Error("You are not friends!")
    }
    if(friend.gameRequests.some((el)=>{
        return el.username === this.name
    })){
        return;
    }
    friend.gameRequests = friend.gameRequests.concat({
        username: this.name
    })
    await friend.save()
}

userScheme.methods.acceptChallange = async function(username){
    const friend = await User.findOne({
        name: username
    })
    if(!friend){
        throw new Error("Wrong username")
    }
    if(!this.gameRequests.some((el)=>{
        return el.username === friend.name
    })){
        throw new Error("You don't have that game request!")
    }
    friend.currentlyPlayingWith = this.name
    this.currentlyPlayingWith = friend.name
    this.gameRequests = this.gameRequests.filter((el)=>{
        return el.username === friend.username
    })
    await this.save()
    await friend.save()
}

userScheme.methods.rejectChallange = async function(username){
    const friend = await User.findOne({
        name: username
    })
    if(!friend){
        throw new Error("Wrong username")
    }
    if(!this.gameRequests.some((el)=>{
        return el.username === friend.name
    })){
        throw new Error("You don't have that game request!")
    }
    this.gameRequests = this.gameRequests.filter((el)=>{
        return el.username === friend.username
    })
    await this.save() 
}

userScheme.methods.endGame = async function(username){
    const friend = await User.findOne({
        name: username
    })
    if(!friend) return;
    if(username !== this.currentlyPlayingWith) return;
    //do some stuff about winning etc
    friend.currentlyPlayingWith = "";
    this.currentlyPlayingWith = "";
    friend.currentGameChessMoves.enemy = [];
    friend.currentGameChessMoves.me = [];
    this.currentGameChessMoves.enemy = []
    this.currentGameChessMoves.me = [];
    await friend.save()
    await this.save()
}

userScheme.methods.addNewChessMove = async function(chessPiece,whichField,target){
    const newChessMove = {
        chessPiece,
        whichField
    }
    try{
        if(target === "me"){
            this.currentGameChessMoves.me.push(newChessMove)
        }
        if(target === "enemy"){
            this.currentGameChessMoves.enemy.push(newChessMove)
        }
    }catch(e){
        console.log(e);
    }
}

//static methods
userScheme.statics.findByCredentials = async function(email, password){
    const user = await User.findOne({
        email
    })
    if(!user){
        throw new Error("Unable to log in")
    }

    if(!await bcrypt.compare(password, user.password)){
        throw new Error("Unable to log in")
    }

    return user
}

//middleware
userScheme.pre("save",async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,8)
    }
    next()
})


const User = mongoose.model("User",userScheme)
module.exports = User;