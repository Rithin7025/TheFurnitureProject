const User = require("../models/userModel")
const randomstring = require("randomstring")
const handlebars = require("handlebars")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const SMTPConnection = require("nodemailer/lib/smtp-connection")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
require("dotenv").config
const dbUsername = process.env.DB_USERNAME
const dbPassword = process.env.DB_PASSWORD
const secretKey = process.env.SECRET_KEY
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env
const Address = require("../models/addressModel")
const Cart = require("../models/cartModel")
const mongoose = require("mongoose")
const productHelper = require("../helpers/productHelper")
const userHelpers = require("../helpers/userHelpers")
const Order = require("../models/orderModel")
const Razorpay = require("razorpay")
const moment = require("moment-timezone")
const { ObjectId } = require("mongodb")
const couponHelpersHelper = require("../helpers/couponHelpers-Helper")

const addAdress = async (req, res) => {
  try {
    const userId = req.params.id
    const formDetails = req.body
    let address = await Address.create({
      user_id: userId,
      name: formDetails.name,
      streetAddress: formDetails.streetAddress,
      pincode: formDetails.pincode,
      phone: formDetails.phone,
    })

    res.redirect(`/userAccount`)
  } catch (error) {
    console.log(error.message)
  }
}

const makeDefaultAddress = async (req, res) => {
  try {
    const userId = req.session.user_id
    const addressId = req.params.Id

    const NewAdress = await Address.updateMany(
      { user_id: userId },
      { $set: { isShippingAddress: false } }
    ).then(() => {
      return Address.updateOne(
        { user_id: userId, _id: addressId },
        { $set: { isShippingAddress: true } }
      ).catch((error) => console.log("error updating documents : ", error))
    })

    res.redirect("/userAccount")
  } catch (error) {
    console.log(error.message)
  }
}

//fetch the address from the address collection and load form with the address
const useAddressCheckout = async (req, res) => {
  try {
    const userId = req.session.user_id
    const addressId = req.params.Id
    const isUserLoggedIn = req.session.user_id !== undefined
    const address = await Address.find({ _id: addressId })

    // const cart = await Cart.findOne({ user_id: userId });

    // if (!cart) {
    //   // Handle cart not found
    //   // return res.status(404).json({ message: "Cart not found" });
    //   return res.render("users/cartnotFounderror");
    // }

    // const productIds = cart.products.map((product) => product.productId);

    // const products = await Product.find({ _id: { $in: productIds } }).lean();

    // cart.products.forEach((product) => {
    //   const matchingProduct = products.find(
    //     (p) => p._id.toString() === product.productId.toString()
    //   );

    //   if (matchingProduct) {
    //     product.name = matchingProduct.name;
    //     product.price = matchingProduct.price;
    //     product.image = matchingProduct.image[0];
    //   }
    // });

    // cart.total = cart.products.reduce((total, product) => {
    //   return total + product.total;
    // }, 0);

    // console.log("aaaaadressssssssssssss", address);

    // res.render("users/checkout", {
    //   address,
    //   user: true,
    //   isUserLoggedIn,

    // });
    /*================================================================================================================================================================================ */

    const cart = await Cart.findOne({ user_id: userId })
      .populate({
        path: "products.productId",
        populate: { path: "category", select: "categoryOffer" },
      })
      .lean()
      .exec()

    if (cart) {
      const products = cart.products.map((product) => {
        //finding the total of all products
        const total = Number(product.quantity) * Number(product.productId.price)

        //calculating the offer for product and category

        const categoryOfferPercentage = product.productId.category.categoryOffer
        const productOfferPercentage = product.productId.productOffer

        const categoryDiscountAmount = (total * categoryOfferPercentage) / 100

        const productDiscountAmount = (total * productOfferPercentage) / 100

        console.log(
          "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^"
        )

        console.log("total =", total)
        console.log("categoryOfferPercentage=", categoryOfferPercentage)
        console.log("productOfferPercentage", productOfferPercentage)
        console.log("categoryDiscountAmount", categoryDiscountAmount)
        console.log("productDiscountAmount", productDiscountAmount)

        const finalAmount =
          total - productDiscountAmount - categoryDiscountAmount
        console.log("finalAmount===", finalAmount)

        console.log(
          "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^"
        )

        return {
          _id: product.productId._id.toString(),
          name: product.productId.name,
          categoryOffer: product.productId.category.categoryOffer, // Access the category field directly
          image: product.productId.image,
          price: product.productId.price,
          description: product.productId.description,
          finalAmount: finalAmount,
          discountAmount: categoryDiscountAmount + productDiscountAmount,
          productOffer: product.productId.productOffer,
          quantity: product.quantity,
          total: total,
          user_id: req.session.user_id,
          totalDiscountPercentage:
            productOfferPercentage + categoryOfferPercentage,
        }
      })

      console.log("----------------------------------------------------------")

      console.log("here is the product detail", products)

      console.log("----------------------------------------------------------")

      //total value of all products in the cart

      const total = products.reduce(
        (sum, product) => sum + Number(product.total),
        0
      )

      //calculating total product offer discount amount

      let totalProductDiscountAmount = 0

      const productDiscounts = cart.products.forEach((item) => {
        const quantity = item.quantity
        const price = item.productId.price
        const productOffer = item.productId.productOffer

        const discountAmount = (quantity * price * productOffer) / 100
        totalProductDiscountAmount += discountAmount
      })

      //calculating total discount for category

      let totalCategoryDiscountAmount = 0

      const categoryDiscounts = cart.products.forEach((item) => {
        const actualProductAmount = item.productId.price * item.quantity
        const categoryOffer = item.productId.category.categoryOffer

        const categoryDiscountAmount =
          (actualProductAmount * categoryOffer) / 100
        totalCategoryDiscountAmount += categoryDiscountAmount
      })

      console.log("-------------------------------------------------------")

      console.log(totalCategoryDiscountAmount)
      console.log(totalProductDiscountAmount)

      console.log("-------------------------------------------------------")

      //coupon request configuaration

      let couponError = false
      let couponApplied = false

      if (req.session.couponInvalidError) {
        couponError = req.session.couponInvalidError
      } else if (req.session.couponApplied) {
        couponApplied = req.session.couponApplied
      }

      // Existing Coupon Status Validation & Discount amount calculation using couponHelper
      let couponDiscount = 0

      console.log("until here its all fine------------------------------->>>>")

      const eligibleCoupon =
        await couponHelpersHelper.checkCurrentCouponValidityStatus(
          userId,
          total
        )

      if (eligibleCoupon.status) {
        couponDiscount = eligibleCoupon.couponDiscount
      } else {
        couponDiscount = 0
      }

      //total amount by reducing offer price

      let TotalAmount =
        total -
        couponDiscount -
        totalProductDiscountAmount -
        totalCategoryDiscountAmount

      // To display the wallet amount blance in checkout page

      //   const walletDetails = await Wallet.findOne({ userId: userId }).lean();

      res.render("users/checkout", {
        isUserLoggedIn,
        address: address,
        products,
        total,
        couponApplied,
        couponError,
        couponDiscount,
        TotalAmount: TotalAmount,
        //walletDetails,
        user: true,
      })
      delete req.session.couponApplied

      delete req.session.couponInvalidError
    } else {
      res.redirect("/cartpageLoad")
    }
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  addAdress,
  makeDefaultAddress,
  useAddressCheckout,
}
