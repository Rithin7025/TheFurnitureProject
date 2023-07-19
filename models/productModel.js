const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    image: [
        { 
            type: String 
        }
    ],

    description : {
        type : String,
        required : true
    },
    is_blocked :{
        type : Boolean,
        default : false
    },
    category : {
        type : String,
        required : true
    },
    stockQuantity : { 
        type : Number,
        required : true
    }




});

module.exports = mongoose.model('Product', productSchema);