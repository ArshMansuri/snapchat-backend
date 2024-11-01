require('dotenv').config({"path": "./config/config.env"})
const express = require('express')
const app = express()
const PORT = process.env.PORT || 6010 
const http = require('http')
const cors = require('cors')
const bodyparser = require("body-parser")
const cookiParser = require('cookie-parser')
const socketIo = require('socket.io');
const user = require('./routes/user')
const cloudinary = require("cloudinary")



//================== MiddelWers =====================================
const corsOptions = {
    origin: true,
    credentials: true, 
};

const server = http.createServer(app)
const io = socketIo(server)


app.use(cors(corsOptions));  
app.use(bodyparser.json({limit: "50mb"}))
app.use(express.json({limit: "50mb"}))
app.use(express.urlencoded({extended: true}))
app.use(cookiParser())


//================== Data Base Connection ===========================
const {connectDataBase} = require('./db/conDB')
connectDataBase()


//================== Cloudinary Config =============================
// cloudinary.config({
//     cloud_name: process.env.CLOUD_NAME,
//     api_key: process.env.CLOUD_API_KEY,
//     api_secret: process.env.CLOUD_API_SECRET
// })
cloudinary.config({
    cloud_name: "dbirutg8t",
    api_key: "619987263695353",
    api_secret: "4zQhnQHPG03lm4dJ15WFG--tMNc"
})


//=================== Routers =======================================
app.use('/api/v1', user)


app.get('/', (req,res)=>{
    res.send("Snapchat")
})

//=================== Server Start ====================================
server.listen(PORT, ()=>{
    console.log(`App listen on port ${PORT}`)
})

module.exports = {io};