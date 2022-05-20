'use strict'

//Selecting html elements
const loginForm = document.querySelector(".login-form")
const emailInput = document.querySelector(".email-input")
const passwordInput = document.querySelector(".password-input")
const goBackButton = document.querySelector(".go-back-button")

//Redirecting to the starting page
goBackButton.addEventListener("click",()=>{
    window.location.href = window.location.href.slice(0,window.location.href.lastIndexOf("/"))
})

//Logging into an existing account
loginForm.addEventListener("submit",async (e)=>{
    e.preventDefault()
    const url = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/users/login"
    const email = emailInput.value
    const password = passwordInput.value
    const body = {
        email,
        password
    }
    try{
        const response = await fetch(url,{
            method: "POST",
            body: JSON.stringify(body),
            headers: {"Content-type": "application/json"}
        })
        if(response.status !== 200){
            throw new Error("Logging in failed")
        }
        const data = await response.json()
        console.log("logged successfully",data);
        window.localStorage.setItem("token",data.token) //Storing authentication token
        window.localStorage.setItem("username",data.user.name)
        window.location.href = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/main.html"
    }catch(e){
        console.log("an error has occured", e);
    }
})



