const mongoose = require('mongoose');
const {Schema,model} = mongoose;
const addressSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  pincode: {
    type: Number,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  isShippingAddress: {
    type: Boolean,
    default: false,
  },
});

module.exports = model('Address',addressSchema);