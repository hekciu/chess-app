'use strict'

const { default: mongoose } = require("mongoose")

const connectionURL = "mongodb://localhost:27017/chess-app"

mongoose.connect(connectionURL,{
    useNewUrlParser: true
}).then(()=>{
    console.log("Connected well to the database at url: " + connectionURL);
}).catch((error)=>{
    console.log("An error has occured while connecting to database");
    console.log("Error details: ", error.message);
})