const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Product = require("../models/productModel");
const sharp = require("sharp");
const Order = require("../models/orderModel");
const adminHelpers = require("../helpers/adminHelpers");

const Category = require("../models/categoryModel");
const fs = require("fs");

const path = require("path");
const moment = require("moment-timezone");
const { ObjectId } = require("mongodb");


//all orders table 

const getOrderDetails = async (req, res) => {
  try {
    const orderData = await Order.find().populate("user_id").lean();
    console.log(orderData);

    const orderHistory = await orderData.map((history) => {
      const createdOnIst = moment(history.date)
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY h:mm A");

      return { ...history, date: createdOnIst, name: history.user_id.name };
    });

    console.log(orderHistory);
    res.render("admin/allOrders", { orderData: orderHistory });
  } catch (error) {
    console.log(error.message);
  }
};

//admin order in detailed view

const adminOrderDetailView = async (req, res) => {
  try {
    const orderId = req.query.id;

    console.log(orderId, "orderId");
    const order = await Order.findOne({ _id: orderId }).populate({
      path: "products.productId",
      select: "name price image",
    });

    console.log(
      order,
      "---------------------------------------------------------------------------------------------------------"
    );

    const createdOnIST = moment(order.date)
      .tz("Asia/Kolkata")
      .format("DD-MM-YYYY h:mm A");
    order.date = createdOnIST;

    const orderDetails = order.products.map((product) => {
      const images = product.productId.image || []; // Set images to an empty array if it is undefined
      const image = images.length > 0 ? images[0] : ""; // Take the first image from the array if it exists

      return {
        name: product.productId.name,
        image: images,
        price: product.productId.price,
        total: product.total,
        quantity: product.quantity,
        status: order.status,
      };
    });

    const deliveryAddress = {
      name: order.addressDetails.name,
      streetAddress: order.addressDetails.streetAddress,

      pincode: order.addressDetails.pincode,
      phone: order.addressDetails.phone,
    };

    const cancellationStatus = order.cancellationStatus;
    const subTotal = order.totalprice;

    // console.log(cancellationStatus, "cancellationStatus");
    // console.log(subTotal, "subtotal");
    // console.log(orderDetails, "orderDetails");
    // console.log(deliveryAddress, "deliveryAddress");

    res.render("admin/adminOrderDetailViewOG", {
      orderDetails: orderDetails,
      deliveryAddress: deliveryAddress,
      subtotal: subTotal,
      orderId: orderId,
      orderDate: createdOnIST,
      cancellationStatus: cancellationStatus,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//to confirm the order which has been placed by the user 

const orderConfirmation = async (req, res) => {
  try {
    const orderId = req.body.orderId;

    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },

      { $set: { status: "shipped", cancellationStatus: "shipped" } },
      { new: true }
    ).exec();

    console.log(updatedOrder);

    const url = "/admin/adminOrderDetailView?id=" + orderId;

    res.redirect(url);
  } catch (error) {
    console.log(error);
  }
};



const cancelledByAdmin = async (req, res) => {
  try {
    const id = req.body.orderId;
    console.log(id, "id");

    const url = "/admin/adminOrderDetailView?id=" + id;
    console.log(url, "url");
    const product = await Order.findOne({_id :id });
    console.log("________________________________________________");

    console.log(product)
    console.log("________________________________________________");
    

    

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          cancellationStatus: "cancelled",
          status: "cancelled",
        },
      },
      { new: true }
    ).exec();

    const productsInorder = updateOrder.products



    for (const product of productsInorder){
      const productId = product.productId;
      const quantity = product.quantity;


      await Product.findByIdAndUpdate(productId,{
        $inc : {stockQuantity: quantity}
      })
    }

    res.redirect(url);
  } catch (error) {
    console.log(error.message);
  }
};

const rejectCancellation = async (req, res) => {
  try {

    console.log(
    'entered into the reject '
    )
    const orderId = req.body.orderId;
    console.log(orderId, "orderID..............");



    const updateOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { cancellationStatus: "Not requested" } },
      { new: true }
    ).exec();

    console.log('ended---------------------------XXx')


    const url = "/admin/adminOrderDetailView?id=" + orderId;

    res.redirect(url);
  } catch (error) {
    console.log(error.message);
  }
};

const orderDeliver = async (req, res) => {
  try {
    const orderId = req.body.orderId;

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { status: "Delivered", cancellationStatus: "Delivered" } },
      { new: true }
    ).exec();

    const url = "/admin/adminOrderDetailView?id=" + orderId;

    res.redirect(url);
  } catch (error) {
    console.log(error);
  }
};


const orderDetailPageLoad = async (req, res) => {
  const orderId = req.params.id;

  console.log(orderId);

  try {
    const isUserLoggedIn = req.session.user_id !== undefined;
    const userId = req.session.user_id;

    const order = await Order.findOne({ _id: orderId }).populate({
      path: "products.productId",
      select: "name price image",
    });

    const createdOnIST = moment(order.date)
      .tz("Asia/Kolkata")
      .format("DD-MM-YYYY h:mm A");
    order.date = createdOnIST;

    const orderDetails = order.products.map((product) => {
      const images = product.productId.image || []; // Set images to an empty array if it is undefined
      const image = images.length > 0 ? images[0] : ""; // Take the first image from the array if it exists

      return {
        name: product.productId.name,
        image: images,
        price: product.productId.price,
        total: product.total,
        quantity: product.quantity,
        status: order.status,
      };
    });

    const deliveryAddress = {
      name: order.addressDetails.name,
      streetAddress: order.addressDetails.streetAddress,

      pincode: order.addressDetails.pincode,
      phone: order.addressDetails.phone,
    };

    const cancellationStatus = order.cancellationStatus;
    const subTotal = order.totalprice;

    res.render("users/orderDetailView1", {
      isUserLoggedIn,
      orderDetails: orderDetails,
      deliveryAddress: deliveryAddress,
      subtotal: subTotal,
      orderId: orderId,
      orderDate: createdOnIST,
      cancellationStatus: cancellationStatus,
    });
  } catch (error) {}
};






const cancelOrder = async (req, res) => {
  try {
    const id = req.body.orderId;
    const url = "/orderDetailView1/" + id;

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "Pending",
          cancellationStatus: "cancellation requested",
        },
      },
      { new: true }
    ).exec();

    res.redirect(url);
  } catch (error) {
    console.log(error.message);
  }
};


const returnOrderUser = async(req,res)=>{
  const {orderId} = req.body
  const url = '/orderDetailView1/' + orderId;

  const orderDetails = await Order.find({_id : orderId})


  const updateOrder = await Order.findByIdAndUpdate(

    { _id: orderId },
    {
      $set: {
        cancellationStatus: "Return requested",
      },
    }

  );
 
  console.log(updateOrder)
    res.redirect(url)



  console.log(orderId)

}

const adminAcceptReturn = async(req,res)=>{
  const {orderId} = req.body;
  
  
  const order = await Order.findOne({_id:orderId}).populate({
    path : 'products.productId',
    select : 'stockQuantity'
  })
  
  console.log(order,'order is here==========================================')
  //update the stock quantity in the product collection



  console.log('reached after updating the stock===================================');

  if(!order){
    return res.status(404).send('order not found')
  }

   
  const updatedOrder = await Order.findByIdAndUpdate(
    { _id: orderId },
    {
      $set: { cancellationStatus: "Order returned", status : "returned" },
    }
  );




  const productsInorder = updatedOrder.products




  for(const product of productsInorder){
    const productId = product.productId;
    const quantity = product.quantity;

  

    await Product.findByIdAndUpdate(productId, {
        $inc : {stockQuantity: quantity}
    })


  }

  //update the stock quantity in stock collection 
    
  const url = "adminOrderDetailView?id=" + orderId;


  res.redirect(url)


}











const adminRejectReturn = async (req, res) => {
  const { orderId } = req.body;

  const OrderHere = await Order.findOne({ _id: orderId });

  const updateOrder = await Order.findByIdAndUpdate(
    { _id: orderId },
    {
      $set: { cancellationStatus: "Return rejected", status: "Delivered" },
    }
  );


  const url = "adminOrderDetailView?id=" + orderId;

  res.redirect(url);
};


module.exports = {
  getOrderDetails,
  adminOrderDetailView,
  orderConfirmation,
  cancelledByAdmin,
  rejectCancellation,
  orderDeliver,
  orderDetailPageLoad,
  cancelOrder,
  returnOrderUser,
  adminAcceptReturn,
  adminRejectReturn,
};