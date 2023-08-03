const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
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
      type: String,
    },
  },

  status: {
    type: String,
  },
  totalprice: {
    type: Number,
    require: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        require: true,
        default: 1,
      },
      total: {
        type: Number,
        require: true,
      },
    },
  ],

  date: {
    type: Date,
    default: Date.now,
  },
  orderValue: {
    type: Number,
    require: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  cancellationStatus: {
    type: String,
    default: "Not requested",
  },
  couponDiscount: {
    type: Number,
    default: 0,
  },

  productOfferDiscount: {
    type: Number,
    default: 0,
  },
  categoryOfferDiscount: {
    type: Number,
    default: 0,
  },
  actualOrderValue: {
    type: Number,
    require: true,
  },
  cancelledOrder: {
    type: Boolean,
    default: false,
  }
});


module.exports = mongoose.model("Order", orderSchema);
