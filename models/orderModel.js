const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  addressDetails: {
    name: {
      type: String,
      required: true,
    },
    streetAddress: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    ordernote: {
      type: String
    }
  },
  

 

  status: {
    type: String,
   
  },
 products: {
    type: [mongoose.Schema.Types.Mixed],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  orderValue:{
    type:Number,
    require:true
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  cancellationStatus : {
    type : String,
    default:"Not requested"
  }
});














module.exports = mongoose.model("Order", orderSchema);
