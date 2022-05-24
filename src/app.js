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

//Authentication
const socketAuthentication = async function(token){
    const decoded = jwt.verify(token,"temporary-secret-phrase")
    const user = await User.findOne({
        _id: decoded._id,
        "tokens.token": token
    })
    
    if(!user){
        throw new Error("Something went wrong during authentication...")
    }
    return user
}

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
    socket.on("new game",async (data)=>{
        console.log("New game:",data);
        currentlyPlayedGames.push([data.player1,data.player1Color,data.player2,data.player2Color])
        console.log("Currently played games:",currentlyPlayedGames);
        io.emit("new game",data)
        //Set game colors
        try{
            const player1 = await User.findOne({
                name: data.player1
            })
            const player2 = await User.findOne({
                name: data.player2
            })
            player1.currentGameColor = data.player1Color;
            player2.currentGameColor = data.player2Color;   
            await player1.save()
            await player2.save()
        }catch(e){
            console.log(e);
        }
    })
    socket.on("end game",async (data)=>{
        try{
            await socketAuthentication(data.token)
            currentlyPlayedGames = currentlyPlayedGames.filter((game)=>{
                return !(game.includes(data.player1) && game.includes(data.player2))
            })
            console.log("Currently played games:",currentlyPlayedGames);
            io.emit("end game",data)
        }catch(e){
            console.log(e);
        }
    })

    socket.on("new-chess-move",async (body)=>{
        console.log("new chess move!!");
        const token = body.token
        try{
            const user = await socketAuthentication(token)
            const enemyUsername = user.currentlyPlayingWith
            const enemy = await User.findOne({
                name: enemyUsername
            })
            if(!enemy){
                throw new Error("Failed to find user with username: " + enemyUsername)
            }
            await user.addNewChessMove(body.chessPiece,body.whichField,"me")
            //convert chess fields
            const enemyVerticalPositions = ["H","G","F","E","D","C","B","A"]
            const enemyHorizontalPositions = ["8","7","6","5","4","3","2","1"]
            const enemyField = enemyVerticalPositions[7 - enemyVerticalPositions.indexOf(body.whichField[0])] + 
            enemyHorizontalPositions[7 - enemyHorizontalPositions.indexOf(body.whichField[1])]
            console.log("my field:",body.whichField);
            console.log("Enemy field:",enemyField);
            await enemy.addNewChessMove(body.chessPiece,enemyField,"enemy")
            await user.save()
            await enemy.save()
            io.emit("new-chess-move",{
                player1: user.currentlyPlayingWith,
                player2: user.name
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