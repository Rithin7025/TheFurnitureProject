const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const Razorpay = require("razorpay");
const userHelpers = require("./userHelpers");

const instance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

module.exports = {
  getProductListForOrders: async (userId) => {
    try {
      //findin the produdts from the cart
      const productDetails = await Cart.findOne({ user_id: userId });
      //prodcut details coming here

      //   conditon (no cart or no products inside cart)
      if (!productDetails || !productDetails.products) {
        return false;
      }

      //finding the sub total of the cart using reduce function
      const subTotal = productDetails.products.reduce((acc, product) => {
        return acc + product.total;
      }, 0);

      const products = productDetails.products.map((product) => ({
        productId: product.productId,
        quantity: product.quantity,
        total: product.total,
      }));

      console.log("sui ===", products);

      return products;
    } catch (error) {
      console.log(error.message);
      return false;
    }
  },

  getCartValue: (userId) => {
    return new Promise(async (resolve, reject) => {
      const productDetails = await Cart.findOne({ user_id: userId });

      const subTotal = productDetails.products.reduce((acc, products) => {
        return acc + products.total;
      }, 0);

      if (subTotal) {
        resolve(subTotal);
      } else {
        reject(false);
      }
    });
  },

  placingOrder: async (userId, orderData, orderedProducts, totalOrderValue) => {
    let orderStatus =
      orderData["payment-method"] === "COD" ? "Pending" : "PENDING";

    console.log(orderData["payment-method"]);

    const address = {
      name: orderData.name,
      streetAddress: orderData.streetAddress,
      pincode: orderData.pincode,
      phone: orderData.phone,
      ordernote: orderData.ordernote,
    };

    const orderDetails = new Order({
      user_id: userId,
      addressDetails: address,
      status: orderStatus,
      paymentMethod: orderData["payment-method"],
      products: orderedProducts,
      date: Date(),
      totalprice: totalOrderValue,
    });
    console.log(
      "The order details which is saved to the order collection",
      orderDetails
    );

    const placedOrder = await orderDetails.save();

    const stockUpdate = await userHelpers.udateProductStock(orderedProducts);

    //clearing the cart after the placeOrder
    await Cart.deleteMany({ user_id: userId });

    // retreiving the order id of the order
    let dbOrderId = placedOrder._id.toString();

    console.log(
      "orderid =============================================",
      dbOrderId
    );

    return dbOrderId;
  },

  generateRazorPayOrder: async (orderId, totalOrderValue) => {
    console.log(totalOrderValue);
    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++");
    orderValue = totalOrderValue * 100;
    console.log(orderValue);

    const order = await Order.findById(orderId)
      .populate("user_id")
      .lean()
      .exec();

    let razorpayOrderDetails = {
      amount: orderValue,
      currency: "INR",
      receipt: orderId,
    };

    const razorpayResultPromise = new Promise((resolve, reject) => {
      instance.orders.create(
        razorpayOrderDetails,
        function (err, orderResult) {
          if(err) {
            reject(err);
            return;
          }
          resolve(orderResult);
        }
      );
    })

    const razorpayOrderResult = await razorpayResultPromise.catch((err) => console.trace(err));


    let orderDetails = {
      order,
      razorpayOrder: razorpayOrderResult,
    };

    console.log("orderDetails -----------------------------");
    console.log(orderDetails);
    console.log("orderDetails -----------------------------");

    return orderDetails;
  },

  calculateDiscountedPrice: function (price, discountPercentage) {
    const discountedPrice = price - price * (discountPercentage / 100);
    return discountedPrice.toFixed(2);
  },
};
