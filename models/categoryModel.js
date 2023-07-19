const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({

name : {
    type : String,
    required : true,
    unique : true
    

},
image : {
    type : String,
    required : true
},
is_hide : {
    type :Boolean,
    default : false
}






})


module.exports = mongoose.model('Category',categorySchema)

