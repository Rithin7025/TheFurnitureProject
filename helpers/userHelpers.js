const Category = require("../models/categoryModel");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const Product = require('../models/productModel');
const mongoose = require('mongoose')
require('dotenv').config;
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;



const Razorpay = require('razorpay');
const { ObjectId } = require("mongodb");
var instance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret:  RAZORPAY_SECRET_KEY ,
});


module.exports = {
  verifyOnlinePayment: (paymentData) => {
    console.log(paymentData);

    return new Promise((resolve, reject) => {
      console.log("From here......");
      const crypto = require("crypto"); // Requiring crypto Module here for generating server signature for payments verification
      console.log(crypto);
      let razorpaySecretKey = RAZORPAY_SECRET_KEY;
      console.log(razorpaySecretKey);
      let hmac = crypto.createHmac("sha256", razorpaySecretKey); // Hashing Razorpay secret key using SHA-256 Algorithm
      console.log(hmac);
      hmac.update(
        paymentData["razorpayServerPaymentResponse[razorpay_order_id]"] +
          "|" +
          paymentData["razorpayServerPaymentResponse[razorpay_payment_id]"]
      );
      // Updating the hash (re-hashing) by adding Razprpay payment Id and order Id received from client as response

      let serverGeneratedSignature = hmac.digest("hex");
      // Converted the final hashed result into hexa code and saving it as server generated signature

      let razorpayServerGeneratedSignatureFromClient =
        paymentData["razorpayServerPaymentResponse[razorpay_signature]"];

      console.log(
        razorpayServerGeneratedSignatureFromClient,
        "helooooooooooooo"
      );
      if (
        serverGeneratedSignature === razorpayServerGeneratedSignatureFromClient
      ) {
        // Checking that is the signature generated in our server using the secret key we obtained by hashing secretkey,orderId & paymentId is same as the signature sent by the server

        console.log("Payment Signature Verified");
        resolve();
      } else {
        console.log("Payment Signature Verification Failed");

        reject();
      }
    });
  },

  updateOnlineOrderPaymentStatus: (ordersCollectionId, onlinePaymentStatus) => {
    return new Promise(async (resolve, reject) => {
      if (onlinePaymentStatus) {
        const orderUpdate = await Order.findByIdAndUpdate(
          { _id: new ObjectId(ordersCollectionId) },
          { $set: { status: "Placed" } }

        ).then(() => {
          resolve();
        });
          
      } else {
        const orderUpdate = await Order.findByIdAndUpdate(
          { _id: new ObjectId(ordersCollectionId) },
          { $set: { status: "Failed" } }
        ).then(() => {
          resolve();
        });
      }
    });
  },

  getCartValue: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const productDetails = await Cart.findOne({ user_id: userId }).lean();
        console.log(productDetails, "productDetails");

        // Calculate the new subtotal for all products in the cart
        const subtotal = productDetails.products.reduce((acc, product) => {
          return acc + product.total;
        }, 0);

        console.log(subtotal, "subtotal");

        if (subtotal) {
          resolve(subtotal);
        } else {
          resolve(false);
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  udateProductStock: async (orderedProducts) => {
    try {
      for (const orderedProduct of orderedProducts) {
        const productId = orderedProduct.productId;
        const quantity = orderedProduct.quantity;

        console.log(
          "the quantity of the ordered products ===========================>>>",
          quantity
        );

        const product = await Product.findById(productId);

        // Update the product stock by subtracting the ordered quantity

        product.stockQuantity -= quantity;

        //save the product in the
        await product.save();
      }
    } catch (error) {}
  },

  changeProductQuantity: async (req, res) => {
    try {

      const userId = new mongoose.Types.ObjectId(req.body.userId);
      const productId = new mongoose.Types.ObjectId(req.body.productId);
      const quantity = req.body.quantity;

      const count = req.body.count;
      const cartFind = await Cart.findOne({user_id : userId});
      const cartId = cartFind._id;

      //find the cart for given user and product 
       const cart = await Cart.findOneAndUpdate(
         { user_id: userId, "products.productId": productId },
         { $inc: { "products.$.quantity": count } },
         { new: true }
       )
         .populate({
           path: "products.productId",
           populate: { path: "category", select: "categoryOffer" },
         })
         .exec();

        //update the total for specific product in the cart

        const updatedProduct = cart.products.find((product)=>{
         return  product.productId._id.equals(productId);
        })
        console.log(updatedProduct,'the product')

        updatedProduct.total = updatedProduct.productId.price * updatedProduct.quantity ;   

        console.log(updatedProduct.total, 'the total itself -------------xxxx')

        await cart.save();


        const total = cart.products.reduce((sum,product) => sum + Number(product.total),0)



        //calculating total product offer discount amount


        let totalProductDiscountAmount  = 0;

        const productDiscounts = cart.products.forEach((item)=>{
          const quantity = item.quantity;
          const price = item.productId.price;
          const productOffer = item.productId.productOffer;


          const discountAmount = (quantity * price * productOffer) / 100;
          totalProductDiscountAmount += discountAmount;

        })

        //calculating total category discount Amount
         let totalCategoryDiscountAmount = 0;


         const categoryDiscounts = cart.products.forEach((item)=>{
          
          const actualProductAmount = item.productId.price * item.quantity;
          const categoryOffer = item.productId.category.categoryOffer


          const categoryDiscountAmount = (actualProductAmount * categoryOffer) / 100;
          
          totalCategoryDiscountAmount += categoryDiscountAmount;


         })
          
         const TotalAmount = Math.floor(
           total - totalProductDiscountAmount - totalCategoryDiscountAmount
         );



         
         //prepare the response object
         const response = {
          quantity : updatedProduct.quantity,
          TotalAmount : TotalAmount,
         }


         console.log('the response object = ' , response)
         return response



    } catch (error) {

      console.log(error.message)

    }
  },
};
