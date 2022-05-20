'use strict'

//Selecting html elements
const registerForm = document.querySelector(".register-form")
const emailInput = document.querySelector(".email-input")
const passwordInput1 = document.querySelector(".password-input-1")
const passwordInput2 = document.querySelector(".password-input-2")
const usernameInput = document.querySelector(".username-input")
const goBackButton = document.querySelector(".go-back-button")

//Redirecting to the starting page
goBackButton.addEventListener("click",()=>{
    window.location.href = window.location.href.slice(0,window.location.href.lastIndexOf("/"))
})

//Register new account
registerForm.addEventListener("submit",async (e)=>{
    e.preventDefault()
    const url = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/users"
    if(passwordInput1.value !== passwordInput2.value){
        return;
    }
    const body = {
        email: emailInput.value,
        name: usernameInput.value,
        password: passwordInput1.value
    }
    try{
        const response = await fetch(url,{
            method: "POST",
            body: JSON.stringify(body),
            headers: {"Content-type": "application/json"}
        })
        if(response.status !== 201){
            throw new Error("Register failed")
        }
        const data = await response.json() 
        console.log("registered successfully",data);   
        window.localStorage.setItem("token",data.token)//Storing authentication token
        window.localStorage.setItem("username",data.user.name)
        window.location.href = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/main.html"
    }catch(e){
        console.log("An error has occured",e);
    }
    
})  