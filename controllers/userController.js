const User = require("../models/userModel");
const randomstring = require("randomstring");
const handlebars = require("handlebars");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const SMTPConnection = require("nodemailer/lib/smtp-connection");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
require("dotenv").config;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const secretKey = process.env.SECRET_KEY;
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const mongoose = require("mongoose");
const productHelper = require("../helpers/productHelper");
const userHelpers = require("../helpers/userHelpers");
const Order = require("../models/orderModel");
const Razorpay = require("razorpay");
const moment = require("moment-timezone");
const { ObjectId } = require("mongodb");
const Banner = require("../models/bannerModel");
const couponHelpers = require("../helpers/couponHelpers");
const couponHelpersHelper = require("../helpers/couponHelpers-Helper");
const offerHelpers = require("../helpers/offerHelpers");

var instance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//for sending mail
const sendVerifyMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: dbUsername,
        pass: dbPassword,
      },
    });

    const mailOptions = {
      from: dbUsername,
      to: email,
      subject: "For Verification Mail",
      html: `<p>Hi ${name}, Please click here to <a href="http://localhost:3000/register/verify?id=${user_id}">verify</a> your mail.</p>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("Email has been sent :-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

//for reset password
const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: dbUsername,
        pass: dbPassword,
        method: "PLAIN", // Specify the authentication method explicitly
      },
    });

    const mailOptions = {
      from: dbUsername,
      to: email,
      subject: "For Password reset",
      html: `<p>Hi ${name}, Please click here to <a href="http://localhost:3000/forget-password?token=${token}"> reset </a>password.</p>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("Email has been sent :-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadSignup = async (req, res) => {
  try {
    res.render("users/signup", { isRegisterPage: true });
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: spassword,
      mobile: req.body.mobile,
      is_admin: 0,
    });

    const userData = await user.save();

    if (userData) {
      sendVerifyMail(req.body.name, req.body.email, userData._id);
      res.render("users/signup", {
        message: "Registration Success !! please verify your mail",
      });
    } else {
      res.render("users/signup", { message: "Registration failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const verifyMail = async (req, res) => {
  console.log(req.query.id);
  console.log("the mail has been verified");
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: 1 } }
    );
    console.log(updateInfo);

    try {
      res.render("users/emailverification", {
        message: "Email verification successful",
      });
    } catch (error) {
      console.log(error.message);
    }
  } catch (error) {
    console.log(error.message);
  }
};

//for login method

const loginLoad = async (req, res) => {
  try {
    res.render("users/login", { isSignInPage: true });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    console.log(userData);

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_blocked) {
          return res.render("users/login", {
            message: "User has been Blocked by the Admin",
          });
        }

        if (userData.is_admin === 1) {
          return res.render("users/login", { message: "Not a user" });
        }

        if (userData.is_verified === 0) {
          return res.render("users/login", {
            message: "please verify your mail!",
          });
        } else {
          req.session.user_id = userData._id;
          return res.redirect("/home");
        }
      } else {
        return res.render("users/login", {
          message: "Email and password Incorrect",
        });
      }
    } else {
      return res.render("users/login", {
        message: "Email and password Incorrect",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const categories = await Category.find({ is_hide: false })
      .lean()
      .sort({ _id: -1 })
      .limit(5);
    const products = await Product.find({ is_blocked: false });

    const banners = await Banner.find();

    //    console.log(products)
    const isUserLoggedIn = req.session.user_id !== undefined;
    const isGuest = !isUserLoggedIn;

    res.render("users/home", {
      layout: "layout",
      isUserLoggedIn,
      isGuest,
      categories,
      products,
      banners,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.destroy();
    console.log("user is logged out");
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

//

const forgetLoad = async (req, res) => {
  try {
    res.render("users/forget");
  } catch (error) {
    console.log(error.message);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_verified === 0) {
        res.render("users/forget", { message: "please verify your mail" });
      } else {
        const randomString = randomstring.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );

        sendResetPasswordMail(userData.name, userData.email, randomString);
        res.render("users/forget", {
          message: "please check your mail to reset the password",
        });
      }
    } else {
      res.render("users/forget", { message: "user email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("users/forget-password", { user_id: tokenData._id });
    } else {
      console.log("ereerer");
      res.render("users/404", { message: "token is invalid" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//for reset password when it goes to forget-password path
const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;

    const secure_password = await securePassword(password);
    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password } }
    );

    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};
//for verification sendLink
const verificationLoad = async (req, res) => {
  try {
    res.render("users/verification");
  } catch (error) {
    console.log(error.message);
  }
};

//for sending verication link in verification page

const sentVerificationLink = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      sendVerifyMail(userData.name, userData.email, userData._id);

      res.render("users/verification", {
        message: "Verification Mail sent to your email id,please verify",
      });
    } else {
      res.render("users/verification", {
        message: "This mail does Not exists",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadCategorySofa = async (req, res) => {
  try {
    res.render("users/categorySofa");
  } catch (error) {
    console.log(error.message);
  }
};

//load the product page when the user clicks

const productPage = async (req, res) => {
  try {
    const pageName = req.params.category;
    const categoryName = req.params.categoryName;
    const products = await Product.find({
      is_blocked: false,
      category: categoryName,
    });
    console.log(products);

    res.render("users/product-1", { products, pageName });
  } catch (error) {}
};

// ===========================================================load productDetailPage     ====================================================================================================================//

const productDetailPageLoad = async (req, res) => {
  try {
    const isUserLoggedIn = req.session.user_id !== undefined;

    const productData = req.params.id;
    const product = await Product.findOne({ _id: productData });
    console.log(product);

    res.render("users/productDetailPage", { product, isUserLoggedIn });
  } catch (error) {
    console.log(error.message);
  }
};

const userAccountLoad = async (req, res) => {
  try {
    const user_id = req.session.user_id;

    const userData = await User.findById(user_id);
    const addr = await Address.find({ user_id: user_id });
    const shipping = addr.find((val) => val.isShippingAddress == true);

    const orders = await Order.find({ user_id: user_id }).populate({
      path: "products.productId",
      select: "name",
    });

    // const orderDetails = orders.products.map((product) => {

    //   return {
    //     name: product.productId.name,

    //   };
    // });

    const isUserLoggedIn = req.session.user_id !== undefined;

    // res.render("users/userAccount", { userData, addr, shipping, orders });
    res.render("users/dashboard", {
      userData,
      addr,
      shipping,
      orders,
      isUserLoggedIn,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const checkoutPageLoad = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const address = await Address.find({ user_id: userId });

    const isUserLoggedIn = req.session.user_id !== undefined;

    /*=========================================================================================================================

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

    // console.log("uc 473 - address =", address);
    //

    // res.render("users/checkout", {
    //   cartTotal: cart.total,
    //   products: cart.products,
    //   address: address,
    //   user: false,
    //   isUserLoggedIn,
    // });

      //finding cart products 
/*========================================================================================================================= */
    const cart = await Cart.findOne({ user_id: userId })
      .populate({
        path: "products.productId",
        populate: { path: "category", select: "categoryOffer" },
      })
      .lean()
      .exec();

    if (cart) {
      const products = cart.products.map((product) => {
        //finding the total of all products
        const total =
          Number(product.quantity) * Number(product.productId.price);

        //calculating the offer for product and category

        const categoryOfferPercentage =
          product.productId.category.categoryOffer;
        const productOfferPercentage = product.productId.productOffer;

        const categoryDiscountAmount = (total * categoryOfferPercentage) / 100;

        const productDiscountAmount = (total * productOfferPercentage) / 100;

        console.log(
          "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^"
        );

        console.log("total =", total);
        console.log("categoryOfferPercentage=", categoryOfferPercentage);
        console.log("productOfferPercentage", productOfferPercentage);
        console.log("categoryDiscountAmount", categoryDiscountAmount);
        console.log("productDiscountAmount", productDiscountAmount);

        const finalAmount =
          total - productDiscountAmount - categoryDiscountAmount;
        console.log("finalAmount===", finalAmount);

        console.log(
          "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^"
        );

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
        };
      });

      console.log("----------------------------------------------------------");

      console.log("here is the product detail", products);

      console.log("----------------------------------------------------------");

      //total value of all products in the cart

      const total = products.reduce(
        (sum, product) => sum + Number(product.total),
        0
      );

      //calculating total product offer discount amount

      let totalProductDiscountAmount = 0;

      const productDiscounts = cart.products.forEach((item) => {
        const quantity = item.quantity;
        const price = item.productId.price;
        const productOffer = item.productId.productOffer;

        const discountAmount = (quantity * price * productOffer) / 100;
        totalProductDiscountAmount += discountAmount;
      });

      //calculating total discount for category

      let totalCategoryDiscountAmount = 0;

      const categoryDiscounts = cart.products.forEach((item) => {
        const actualProductAmount = item.productId.price * item.quantity;
        const categoryOffer = item.productId.category.categoryOffer;

        const categoryDiscountAmount = Math.floor(
          (actualProductAmount * categoryOffer) / 100
        );

        totalCategoryDiscountAmount += categoryDiscountAmount;
      });

      console.log("-------------------------------------------------------");

      console.log(totalCategoryDiscountAmount);
      console.log(totalProductDiscountAmount);

      console.log("-------------------------------------------------------");

      //coupon request configuaration

      let couponError = false;
      let couponApplied = false;

      if (req.session.couponInvalidError) {
        couponError = req.session.couponInvalidError;
      } else if (req.session.couponApplied) {
        couponApplied = req.session.couponApplied;
      }

      // Existing Coupon Status Validation & Discount amount calculation using couponHelper
      let couponDiscount = 0;

      console.log("until here its all fine------------------------------->>>>");

      const eligibleCoupon =
        await couponHelpersHelper.checkCurrentCouponValidityStatus(
          userId,
          total
        );

      if (eligibleCoupon.status) {
        couponDiscount = eligibleCoupon.couponDiscount;
      } else {
        couponDiscount = 0;
      }

      //total amount by reducing offer price

      let TotalAmount = Math.floor(
        total -
          couponDiscount -
          totalProductDiscountAmount -
          totalCategoryDiscountAmount
      );

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
      });
      delete req.session.couponApplied;

      delete req.session.couponInvalidError;
    } else {
      res.redirect("/cartpageLoad");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const submitCheckout = async (req, res) => {
  console.log(req.body);
  // res.send({COD_CHECKOUT: true});
  // return;
  try {
    console.log(
      "submit checkout is called-------------------------------------->"
    );
    const userId = req.session.user_id;
    const orderDetails = req.body;

    console.log("this is order details from the form", orderDetails);

    const productsOrdered = await productHelper.getProductListForOrders(userId);

    console.log(
      "the prodcuts ordered here----------------------------->>>",
      productsOrdered
    );

    if (productsOrdered) {
      let totalOrderValue = await productHelper.getCartValue(userId);
      // Inserting the actual order value of the cart without any discounts for storing into the DB OrderDetails
      orderDetails.actualOrderValue = totalOrderValue;

      /*==============================Coupon Discounts Calculation==================================================== */

      const availableCouponData =
        await couponHelpersHelper.checkCurrentCouponValidityStatus(
          userId,
          totalOrderValue
        );

      console.log(availableCouponData, "passed--------------------->");

      let couponDiscountAmount = 0;

      if (availableCouponData.status) {
        const couponDiscountAmount = availableCouponData.couponDiscount;
        // Inserting the value of coupon discount into the order details object created above
        orderDetails.couponDiscount = couponDiscountAmount;

        // Updating the total order value with coupon discount applied
        totalOrderValue = totalOrderValue - couponDiscountAmount;

        const updateCouponUsedStatusResult =
          await couponHelpersHelper.updateCouponUsedStatus(
            userId,
            availableCouponData.couponId
          );

        console.log(updateCouponUsedStatusResult, "passed 2 -------------->");
      }

      /*===============================================================Product offer Discount Calculation========================================== */

      // Finding existing product offer applicable to the cart and applying it to the cart value

      const applicableProductOffers =
        await offerHelpers.calculateProductOfferDiscountsForCart(userId);

      const productOfferDiscount = applicableProductOffers;

      // Inserting the value of product offer discount into the order details object created above
      orderDetails.productOfferDiscount = applicableProductOffers;

      //updating the total order value with the eligible product offer discount

      // ========================================== Category Offer Discounts Calculation ==========================================

      // Finding existing category offer applicable to the cart and applying it to the cart value

      const applicableCategoryOffers =
        await offerHelpers.calculateCategoryOfferAmountForCart(userId);
      const categoryOfferDiscount = applicableCategoryOffers;

      // Inserting the value of category offer discount into the order details object created above
      orderDetails.categoryOfferDiscount = applicableCategoryOffers;

      // Updating the total order value with the eligible category offer discount
      const total = Math.floor(
        totalOrderValue - productOfferDiscount - categoryOfferDiscount
      );

      console.log(
        "[[[[[[[[[[---------------****************--------------------]]]]]]]]]]]]]]]]]"
      );

      console.log(total, "totalvvvvvvvvvvvvvvv");

      console.log(
        "[[[[[[[[[[---------------****************--------------------]]]]]]]]]]]]]]]]]"
      );

      productHelper
        .placingOrder(userId, orderDetails, productsOrdered, total)
        .then(async (orderId) => {
          console.log("reached here");

          if (req.body["payment-method"] === "COD") {
            console.log("cod_is true here");
            res.json({ isOk: true, COD_CHECKOUT: true });
          } else if (req.body["payment-method"] === "ONLINE") {
            productHelper
              .generateRazorPayOrder(orderId, total)

              .then(async (razorpayOrderDetails) => {
                console.log(
                  razorpayOrderDetails,
                  "razorpayOrderDetails reached here"
                );
                const user = await User.findById({ _id: userId }).lean();
                console.log(RAZORPAY_ID_KEY, "RAZORPAY_ID_KEY");
                res.json({
                  isOk: true,
                  ONLINE_CHECKOUT: true,
                  userOrderRequestData: orderDetails,
                  orderDetails: razorpayOrderDetails,
                  razorpayKeyId: RAZORPAY_ID_KEY,

                  userDetails: user,
                });
              });
          } else {
            res.send({ isOk: false });
          }
        });
    }
  } catch (error) {
    console.log(error.message);
    res.send({ isOk: false });
  }
};

const verifyPayment = async (req, res) => {
  userHelpers
    .verifyOnlinePayment(req.body)
    .then(() => {
      let receiptId = req.body["serverOrderDetails[receipt]"];
      console.log("entered into the verifyOnlinePayment iin uc");
      let paymentSuccess = true;
      userHelpers
        .updateOnlineOrderPaymentStatus(receiptId, paymentSuccess)
        .then(() => {
          // Sending the receiptId to the above userHelper to modify the order status in the DB
          // We have set the Receipt Id is same as the orders cart collection ID

          res.json({ status: true });
        });
    })
    .catch((err) => {
      if (err) {
        console.log(err);

        let paymentSuccess = false;
        userHelpers
          .updateOnlineOrderPaymentStatus(receiptId, paymentSuccess)
          .then(() => {
            // Sending the receiptId to the above userHelper to modify the order status in the DB
            // We have set the Receipt Id is same as the orders cart collection ID

            res.json({ status: false });
          });
      }
    });
};

const successPageLoad = async (req, res) => {
  const isUserLoggedIn = req.session.user_id !== undefined;

  res.render("users/orderSuccesspage", { isUserLoggedIn });
};

const cancelOrder = async (req, res) => {
  try {
    const id = req.body.orderId;
    const url = "/orderDetailView1?id=" + id;

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

module.exports = {
  loadSignup,
  insertUser,
  verifyMail,
  loginLoad,
  verifyLogin,
  loadHome,
  userLogout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  verificationLoad,
  sentVerificationLink,
  loadCategorySofa,
  productPage,
  productDetailPageLoad,
  userAccountLoad,
  checkoutPageLoad,
  submitCheckout,
  verifyPayment,
  successPageLoad,
  cancelOrder,
};
