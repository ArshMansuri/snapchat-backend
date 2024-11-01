const mongoose = require('mongoose')

exports.connectDataBase = async()=>{
    mongoose.connect(process.env.DataBase,{
    }).then(()=>{
        console.log("Data Base Connected")
    }).catch((err)=>{
        console.log("Data Base Erro:: ", err)
    })
}