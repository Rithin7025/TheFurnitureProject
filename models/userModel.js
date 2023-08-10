const mongoose =require('mongoose')

 const userSchema = new mongoose.Schema({
    name : {
        type :String,
        required : true
    },
    email : {
        type :String,
        required : true,
        unique : true
    },
    mobile:{
        type : Number,
        required : true,
        unique : true
    },
    // image : {
    //     type : String,   
    //     required:true
    // }
    // ,
    password : {
        type: String,
        required: true
    },
    is_admin : {
        type : Number,
        required : true
    },
    is_verified : {
        type : Number,
        default : 0
    },
    token : {
        type : String,
        default:''
    },
    is_blocked : {
        type : Boolean,
        default : false
    },
    referalCode : {

        
        type : String,
        unique: true
    }
 });



  module.exports= mongoose.model('User',userSchema)
