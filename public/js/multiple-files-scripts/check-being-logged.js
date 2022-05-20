'use strict'

const token = window.localStorage.getItem("token");
const url = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/users/me";

(async ()=>{
    const response = await fetch(url,{
        headers: {"Authorization": `Bearer ${window.localStorage.getItem("token")}`},
        method: "GET"
    })
    if(response.status === 200){
        window.location.href = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/main.html"
    }
})()