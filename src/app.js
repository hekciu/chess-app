'use strict'

//Loading npm modules
const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const jwt = require("jsonwebtoken")

//Requiring modules to keep app working correctly
const authentication = require("./middleware/authentication")
const User = require("./models/user-model")

//Paths and global variables
const publicDirectoryPath = path.join(__dirname,"../public")

//Loading routers
const userRouter = require("./routers/user-router")
const gameRouter = require("./routers/game-router")

//Configuring app
require("./db/mongoose")
const app = express();

//Socket.io
const server = http.createServer(app)
const io = socketio(server)

//Global variables
let numberActiveUsers = 0
const namesActiveUsers = []
let currentlyPlayedGames = []

io.on("connection",(socket)=>{
    console.log("New WebSocket connection"); 
    numberActiveUsers++;
    io.emit("active-users-update",{
        numberActiveUsers
    })
    io.emit("check-being-online")
    socket.on("disconnect",()=>{
        numberActiveUsers--;
        namesActiveUsers.splice(0,namesActiveUsers.length)
        console.log("User disconnected");
        io.emit("active-users-update",{
            numberActiveUsers
        })
        io.emit("check-being-online")
    })  
    //Live list of active friends and adding them
    socket.on("new-friend-request",(data)=>{
        console.log("new friend request",data);
        io.emit("new-friend-request",data)
    }) 
    socket.on("list-updates-needed",(data)=>{
        io.emit("list-updates-needed",data)
        io.emit("check-being-online")
    })
    socket.on("check-being-online",(data)=>{
        if(!namesActiveUsers.includes(data.username)){
            namesActiveUsers.push(data.username)
        }
        console.log("Active users: ",namesActiveUsers);
        io.emit("active-users-list-change",{
            newList: namesActiveUsers
        })
    })
    //Handling game requests
    socket.on("new-game-request",(data)=>{
        io.emit("new-game-request",data)
    })

    //Handling starting and ending a game
    socket.on("new game",(data)=>{
        console.log("New game:",data);
        currentlyPlayedGames.push([data.player1,data.player2])
        console.log("Currently played games:",currentlyPlayedGames);
        io.emit("new game",data)
    })
    socket.on("end game",(data)=>{
        currentlyPlayedGames = currentlyPlayedGames.filter((game)=>{
            return !(game.includes(data.player1) && game.includes(data.player2))
        })
        console.log("Currently played games:",currentlyPlayedGames);
        io.emit("end game",data)
    })

    //Socket.io authentication
    socket.on("new-chess-move",async (body)=>{
        const token = body.token
        const decoded = jwt.verify(token,"temporary-secret-phrase")
        try{
            const user = await User.findOne({
                _id: decoded._id,
                "tokens.token": token
            })
            
            if(!user){
                throw new Error("Something went wrong during authentication...")
            }
            //do an array with chess moves in user model
            socket.emit("new-chess-move",{
                chessman: body.chessman,
                whichField: body.whichField,
                from: user.name,
                to: user.currentlyPlayingWith
            })
        }catch(e){
            console.log(e);
        }
    })
})

app.use(express.json());
app.use(express.static(publicDirectoryPath))
app.use(userRouter)
app.use(gameRouter)

module.exports = server;