const mongoose = require('mongoose');


const bannerSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true
    },

    image : {
        type : String,
        required : true
    },
    is_hide : {
        type: Boolean,
        default : false
    }
})

module.exports = mongoose.model('Banner',bannerSchema);

