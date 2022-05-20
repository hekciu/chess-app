'use strict'

const loginButton = document.querySelector(".login-button")
const registerButton = document.querySelector(".register-button")

loginButton.addEventListener("click",()=>{
    window.location.href = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/login.html"
})

registerButton.addEventListener("click",()=>{
    window.location.href = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/register.html"
})