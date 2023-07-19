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

    //    console.log(products)
    const isUserLoggedIn = req.session.user_id !== undefined;
    const isGuest = !isUserLoggedIn;

    res.render("users/home", {
      layout: "layout",
      isUserLoggedIn,
      isGuest,
      categories,
      products,
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
    const productData = req.params.id;
    const product = await Product.findOne({ _id: productData });
    console.log(product);

    res.render("users/productDetailPage", { product });
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
    const orders = await Order.find({ user_id: user_id });

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

const addAdress = async (req, res) => {
  try {
    const userId = req.params.id;
    const formDetails = req.body;
    let address = await Address.create({
      user_id: userId,
      name: formDetails.name,
      streetAddress: formDetails.streetAddress,
      pincode: formDetails.pincode,
      phone: formDetails.phone,
    });

    res.redirect(`/userAccount`);
  } catch (error) {
    console.log(error.message);
  }
};

const makeDefaultAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.params.Id;

    const NewAdress = await Address.updateMany(
      { user_id: userId },
      { $set: { isShippingAddress: false } }
    ).then(() => {
      return Address.updateOne(
        { user_id: userId, _id: addressId },
        { $set: { isShippingAddress: true } }
      ).catch((error) => console.log("error updating documents : ", error));
    });

    res.redirect("/userAccount");
  } catch (error) {
    console.log(error.message);
  }
};

const checkoutPageLoad = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const address = await Address.find({ user_id: userId });

    const cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      // Handle cart not found
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIds = cart.products.map((product) => product.productId);

    const products = await Product.find({ _id: { $in: productIds } }).lean();

    cart.products.forEach((product) => {
      const matchingProduct = products.find(
        (p) => p._id.toString() === product.productId.toString()
      );

      if (matchingProduct) {
        product.name = matchingProduct.name;
        product.price = matchingProduct.price;
        product.image = matchingProduct.image[0];
      }
    });

    cart.total = cart.products.reduce((total, product) => {
      return total + product.total;
    }, 0);

    console.log("uc 473 - address =", address);
    const isUserLoggedIn = req.session.user_id !== undefined;

    res.render("users/checkout", {
      cartTotal: cart.total,
      products: cart.products,
      address: address,
      user: false,
      isUserLoggedIn,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//fetch the address from the address collection and load form with the address
const useAddressCheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.params.Id;
    console.log("us490 =addressId ==== ", addressId);

    const cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      // Handle cart not found
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIds = cart.products.map((product) => product.productId);

    const products = await Product.find({ _id: { $in: productIds } }).lean();

    cart.products.forEach((product) => {
      const matchingProduct = products.find(
        (p) => p._id.toString() === product.productId.toString()
      );

      if (matchingProduct) {
        product.name = matchingProduct.name;
        product.price = matchingProduct.price;
        product.image = matchingProduct.image[0];
      }
    });

    cart.total = cart.products.reduce((total, product) => {
      return total + product.total;
    }, 0);

    const isUserLoggedIn = req.session.user_id !== undefined;

    const address = await Address.find({ _id: addressId });
    console.log("aaaaadressssssssssssss", address);

    res.render("users/checkout", {
      address,
      user: true,
      cartTotal: cart.total,
      products: cart.products,
      isUserLoggedIn,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//taking all the details from the page and save it in the orders collection

//similar to the cart ,
// const placeOrder = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     const { name,  pincode, phone, ordernote } = req.body;
//     const streetAddress = req.body.streetAddress;

//     const cart = await Cart.findOne({ user_id: userId }).lean();
//     if (!cart) {
//       // If cart is empty, handle accordingly
//       return res.status(400).json({ error: "Cart is empty." });
//     }

//     const productIds = cart.products.map((product) => product.productId);
//     const products = await Product.find({ _id: { $in: productIds } }).lean();

//     const productsWithDetails = cart.products.map((product) => {
//       const matchingProduct = products.find(
//         (p) => p._id.toString() === product.productId.toString()
//       );

//       if (matchingProduct) {
//         return {
//           productId: matchingProduct._id,
//           name: matchingProduct.name,
//           image: matchingProduct.image[0],
//           quantity: product.quantity,
//           price: product.price,
//           total: product.total,
//         };
//       }
//     });

//     console.log('',productsWithDetails)

//     const newOrder = new Order({
//       user_id: userId,
//       name: name,
//       streetAddress: streetAddress,
//       pincode: pincode,
//       phone: phone,
//       ordernote: ordernote,
//       products: productsWithDetails,
//       status: "Placed",
//     });

//     const savedOrder = await newOrder.save();

//     console.log('saved order ==',savedOrder)

//     await Cart.findOneAndUpdate(
//       { user_id: userId },
//       { $set: { products: [] } }
//     );

//     res.render("users/orderSuccessPage", { order: savedOrder });
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const orderDetailPageLoad = async (req, res) => {
  const orderId = req.params.id;
  console.log(orderId);

  try {
    const isUserLoggedIn = req.session.user_id !== undefined;

    const order = await Order.findById(orderId);
    const products = order.products.map((product) => {
      return {
        name: product.name,
        quantity: product.quantity,
        image: product.image,
        price: product.price,
      };
    });

    res.render("users/orderDetailView1", { products, isUserLoggedIn });
  } catch (error) {}
};

const submitCheckout = async (req, res) => {
  console.log('BODY [START] --------------------------------------------');
  console.log(req.body);
  console.log('BODY [END] --------------------------------------------');
  // res.send({COD_CHECKOUT: true});
  // return;
  try {
    const userId = req.session.user_id;
    const orderDetails = req.body;
    console.log("this is order details from the form", orderDetails);

    const productsOrdered = await productHelper.getProductListForOrders(userId);

    console.log("the prodcuts ordered here", productsOrdered);

    if (productsOrdered) {
      let totalOrderValue = await productHelper.getCartValue(userId);

      productHelper
        .placingOrder(userId, orderDetails, productsOrdered, totalOrderValue)
        .then(async (orderId) => {
          console.log("reached here");

          if (req.body["payment-method"] === "COD") {
            console.log("cod_is true here");
            res.json({ COD_CHECKOUT: true });
          } else if (req.body["payment-method"] === "ONLINE") {
            productHelper
              .generateRazorPayOrder(orderId, totalOrderValue)
              .then(async (razorpayOrderDetails) => {
                console.log(
                  razorpayOrderDetails,
                  "razorpayOrderDetails reached here"
                );
                const user = await User.findById({ _id: userId }).lean();
                console.log(RAZORPAY_ID_KEY, "RAZORPAY_ID_KEY");
                res.json({
                  ONLINE_CHECKOUT: true,
                  userOrderRequestData: orderDetails,
                  orderDetails: razorpayOrderDetails,
                  razorpayKeyId: RAZORPAY_ID_KEY,

                  userDetails: user,
                });
              });
          }
        });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyPayment = async (req, res) => {
  userHelpers
    .verifyOnlinePayment(req.body)
    .then(() => {
      let receiptId = req.body["serverOrderDetails[receipt]"];

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
  addAdress,
  makeDefaultAddress,
  checkoutPageLoad,
  useAddressCheckout,
  // placeOrder,
  orderDetailPageLoad,
  submitCheckout,
  verifyPayment,
};
