'use strict'

//Selecting html elements
const welcomeScreen = document.querySelector(".welcome-screen")
const logoutButton = document.querySelector(".logout-button")
const friendListElement = document.querySelector(".friend-list")
const friendRequestsElement = document.querySelector(".friend-requests-list")
const addFriendForm = document.querySelector(".add-friend-form")
const friendUsernameInput = document.querySelector(".friend-username-input")
const numberOfActiveUsers = document.querySelector(".number-of-active-users")
const requestsListElement = document.querySelector(".game-requests-list")
const gameRequests = document.querySelector(".game-requests")
const currentlyPlayingDisplay = document.querySelector(".currently-playing-display")
const chessBoardDiv = document.querySelector(".img-div")

const socket = io()

//Global variables
let currentGame;

const makeUrl = function(subSite){
    return window.location.href.slice(0,window.location.href.lastIndexOf("/")) + subSite
}
const displayWelcomeScreen = async function(){
    welcomeScreen.textContent = `Hello ${window.localStorage.getItem("username")}!`
}

const getMyData = async function(){
    const url = makeUrl("/users/me")
    const response = await fetch(url,{
        headers: {"Authorization": `Bearer ${window.localStorage.getItem("token")}`},
        method: "GET"
    })
    const data = await response.json()
    return data
}

const loadFriendList = async function(){
    const data = await getMyData()
    const friendList = data.friends.filter((el)=>{
        return el.username
    })
    friendListElement.innerHTML = "";
    friendList.forEach((friend)=>{
        const html = `<li class="friend-username">${friend.username}</li>`
        friendListElement.insertAdjacentHTML("beforeend",html)
    })
}

const loadGameRequests = async function(){
    const data = await getMyData()
    const requestsList = data.gameRequests.map((el)=>{
        return el.username
    })
    requestsListElement.innerHTML = "";
    requestsList.forEach((username)=>{
        const html = `<li><span class="game-request">${username}</span><span class="accept-game-request">  Accept</span><span class="reject-game-request">  Reject</span></li>`
        requestsListElement.insertAdjacentHTML("beforeend",html)
    })
    addGameRequestEventListeners()
}

const addGameRequestEventListeners = function(){
    const acceptGameRequests = document.querySelectorAll(".accept-game-request")
    acceptGameRequests.forEach((el)=>{
        el.addEventListener("click",async (e)=>{
            const element = e.target.parentElement.querySelector(".game-request")
            const friendName = element.textContent        
            const body = {
                username: friendName
            }
            const url = makeUrl("/game/acceptChallange")
            try{
                const response = await fetch(url,{
                    method: "POST",
                    body: JSON.stringify(body),
                    headers:{
                        "Authorization": `Bearer ${window.localStorage.getItem("token")}`,
                        "Content-Type": "application/json"
                    }
                })
                if(response.status !== 200) throw new Error("Accepting game request failed") 
                await loadGameRequests()
                socket.emit("new game",{
                    player1: window.localStorage.getItem("username"),
                    player2: friendName,
                    player1Color: "White",
                    player2Color: "Black"
                })
            }catch(e){
                console.log(e);
            }
        })
    })

    const rejectGameRequests = document.querySelectorAll(".reject-game-request")
    rejectGameRequests.forEach((el)=>{
        el.addEventListener("click",async (e)=>{
            const element = e.target.parentElement.querySelector(".game-request")
            const friendName = element.textContent        
            const body = {
                username: friendName
            }
            const url = makeUrl("/game/rejectChallange")
            try{
                const response = await fetch(url,{
                    method: "POST",
                    body: JSON.stringify(body),
                    headers:{
                        "Authorization": `Bearer ${window.localStorage.getItem("token")}`,
                        "Content-Type": "application/json"
                    }
                })
                if(response.status !== 200) throw new Error("Rejecting game request failed") 
                await loadGameRequests()
            }catch(e){
                console.log(e);
            }
        })
    })
}

const loadRequestsList = async function(){
    const data = await getMyData()
    const friendRequestsList = data.friendRequests.filter((el)=>{
        return el.username
    })
    friendRequestsElement.innerHTML = "";
    friendRequestsList.forEach((friend)=>{
        const html = `<li><span class="friend-request-username">${friend.username}</span><span class="accept-request">  Accept</span><span class="reject-request">  Reject</span></li>`
        friendRequestsElement.insertAdjacentHTML("beforeend",html)
    })
    
    //Adding event listeners to enable accepting friend requests
    const acceptRequestsElements = document.querySelectorAll(".accept-request")
    acceptRequestsElements.forEach((el)=>{
        el.addEventListener("click",async (e)=>{
            const element = e.target.parentElement.querySelector(".friend-request-username")
            const friendName = element.textContent        
            const body = {
                username: friendName
            }
            const url = makeUrl("/users/acceptFriend")
            try{
                const response = await fetch(url,{
                    method: "POST",
                    body: JSON.stringify(body),
                    headers:{
                        "Authorization": `Bearer ${window.localStorage.getItem("token")}`,
                        "Content-Type": "application/json"
                    }
                })
                if(response.status !== 200) throw new Error("Accepting friend request failed") 
                await loadFriendList()
                await loadRequestsList()
                socket.emit("list-updates-needed",{
                    username: friendName
                })         
            }catch(e){
                console.log("Something went wrong...");
                console.log("Error details",e);
            }
        })
    })
    //Adding event listeners to enable rejecting friend requests
    const rejectRequestsElements = document.querySelectorAll(".reject-request")
    rejectRequestsElements.forEach((el)=>{
        el.addEventListener("click",async (e)=>{
            const element = e.target.parentElement.querySelector(".friend-request-username")
            const friendName = element.textContent        
            const body = {
                username: friendName
            }
            const url = makeUrl("/users/rejectFriend") 
            try{
                const response = await fetch(url,{
                    method: "POST",
                    body: JSON.stringify(body),
                    headers:{
                        "Authorization": `Bearer ${window.localStorage.getItem("token")}`,
                        "Content-Type": "application/json"
                    }
                })
                if(response.status !== 200) throw new Error("Rejecting friend request failed") 
                await loadRequestsList()
            }catch(e){
                console.log("Something went wrong...");
                console.log("Error details",e);
            }
        })
    })
}

//Logging out
logoutButton.addEventListener("click", async ()=>{
    const url = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/users/logout"
    try{
        const response = await fetch(url,{
            method: "POST",
            headers: {"Authorization": `Bearer ${window.localStorage.getItem("token")}`}
        })
        console.log(response);
        window.localStorage.clear()
        window.location.href = window.location.href.slice(0,window.location.href.lastIndexOf("/"))
    }catch(e){
        console.log("Something went wrong...");
        console.log("Error details",e);
    }
})


//Live list of active friends and adding them
socket.on("active-users-list-change",async (data)=>{
    await loadFriendList()
    const friendsList = document.querySelectorAll(".friend-username")
    //Displaying which users are active
    friendsList.forEach((friendEl)=>{
        friendEl.classList.remove("active-user")
        if(data.newList.includes(friendEl.textContent)){
            friendEl.classList.add("active-user")
            //Sending game requests to active friends
            friendEl.addEventListener("click",async ()=>{
                const friendUsername = friendEl.textContent
                const url = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/game/challangeFriend"
                const body = {
                    username: friendUsername
                }
                try{
                    const response = await fetch(url,{
                        method: "POST",
                        headers: {"Authorization": `Bearer ${window.localStorage.getItem("token")}`,
                        "Content-Type": "application/json"},
                        body: JSON.stringify(body)
                    })
                    if(response.status !== 200) throw new Error("Failed to challange friend")
                    socket.emit("new-game-request",{
                        from: window.localStorage.getItem("username"),
                        to: friendUsername
                    })
                }catch(e){
                    console.log(e);
                }
            })
        }
    })
})

window.addEventListener("load",async (event)=>{
    try{
        await displayWelcomeScreen()
        await loadFriendList()
        await loadRequestsList()
        await loadGameRequests()
        const myData = await getMyData()
        console.log(myData.currentlyPlayingWith);
        if(myData.currentlyPlayingWith){
            await startGame()
        }
    }catch(e){
        console.log(e);
    }
})

socket.on("check-being-online",()=>{
    socket.emit("check-being-online",{
        username: window.localStorage.getItem("username")
    })
})

//Sending friend request
addFriendForm.addEventListener("submit",async (e)=>{
    e.preventDefault()
    try{
        const url1 = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/users/requestFriend" 
        const friendUsername = friendUsernameInput.value;
        const body = {
            username: friendUsername
        }
        const response1 = await fetch(url1,{
            headers: {"Authorization": `Bearer ${window.localStorage.getItem("token")}`
            ,"Content-Type": "application/json"
        },
            method: "POST",
            body: JSON.stringify(body)
        })
        if(response1.status !== 200){
            throw new Error("Failed to load friends data, check your authentication")
        }
        const data = await getMyData()
        socket.emit("new-friend-request",{
            from: data.name,
            to: friendUsernameInput.value
        })
    }catch(e){
        console.log(e);
    }
})

//Listen for new friend request
socket.on("new-friend-request",async (data)=>{
    try{
        const myData = await getMyData()
        if(!data.to === myData.name) return;
        await loadRequestsList()
    }catch(e){
        console.log(e);
    }
})

//Listen for database changes
socket.on("list-updates-needed",async (data)=>{
    try{
        const myData = await getMyData()
        if(data.username === myData.name){
            await loadFriendList()
            await loadRequestsList()
            socket.emit("check-being-online",{
                username: window.localStorage.getItem("username")
            })
        }
    }catch(e){
        console.log("Something went wrong...");
        console.log("Error details",e);
    }
})

//Displaying number of active users
socket.on("active-users-update",(data)=>{
    numberOfActiveUsers.textContent = `Number of active users: ${data.numberActiveUsers}`
})

//Handling accepting and rejecting game requests
socket.on("new-game-request",async (data)=>{
    console.log("new game request");
    console.log(data);
    try{
        const myData = await getMyData() 
        const isInGameRequests = myData.gameRequests.some((el)=>{
            return el.username === data.from
        })
        if(!(data.to === window.localStorage.getItem("username") && isInGameRequests)) return;
        const html = `<li><span class="game-request">${data.from}</span><span class="accept-game-request">  Accept</span><span class="reject-game-request">  Reject</span></li>`
        requestsListElement.insertAdjacentHTML("beforeend",html)
        addGameRequestEventListeners()
    }catch(e){
        console.log(e);
    }
})

//Game

socket.on("new game", async (data)=>{
    const myName = window.localStorage.getItem("username")
    console.log(data.player1,data.player2);
    if(data.player1 === myName || data.player2 === myName){
        await startGame()
    }
})

socket.on("end game",(data)=>{
    const myName = window.localStorage.getItem("username")
    if(data.player1 === myName || data.player2 === myName) endGame()
})

const startGame = async function(){
    gameRequests.classList.add("hidden")
    currentlyPlayingDisplay.classList.remove("hidden")
    const myData = await getMyData()
    currentlyPlayingDisplay.innerHTML = `<h4>🟢Currently playing with: ${myData.currentlyPlayingWith}</h4></br>
    <button class="abadon-game-button">Abadon game</button>`
    console.log(myData.name,myData.currentGameColor);
    currentGame = new ChessGameClient(myData.name,myData.currentlyPlayingWith,myData.currentGameColor,socket);
    chessBoardDiv.addEventListener("click",currentGame.boardClickEventListener.bind(currentGame))
    try{
        await currentGame.loadChessMoves()
    }catch(e){
        console.log(e);
    }
    currentGame.displayChessMoves()
    currentGame.listenForSocketE()
    console.log("dupa");
    document.querySelector(".abadon-game-button").addEventListener("click",async ()=>{
        const url = makeUrl("/game/endGame") 
        const myData = await getMyData()
        const friendName = myData.currentlyPlayingWith
        const body = {
            username: friendName
        }
        console.log(body);
        const response = await fetch(url,{
            method: "POST",
            body: JSON.stringify(body),
            headers:{
                "Authorization": `Bearer ${window.localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        })
        if(response.status !== 200){
            throw new Error("Ending game failed")
        }
        endGame()
        socket.emit("end game",{
            player1: window.localStorage.getItem("username"),
            player2: friendName,
            token: window.localStorage.getItem("token")
        })
    })
}

const endGame = function(){
    gameRequests.classList.remove("hidden")
    currentlyPlayingDisplay.classList.add("hidden")
    currentGame = undefined;
}

