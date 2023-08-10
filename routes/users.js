var express = require("express")
var router = express.Router()
const session = require("express-session")
const userController = require("../controllers/userController")
const cartController = require("../controllers/cartController")
const addressController = require("../controllers/addressController")
const orderController = require("../controllers/orderController")
const couponController = require("../controllers/couponController")
const walletController = require("../controllers/walletController")

const auth = require("../middlewares/auth")

router.use(express.static("public"))

/* GET users listing. */

router.get("/", userController.loadHome)

router.get("/register", userController.loadSignup)

router.post("/register", userController.insertUser)

router.get("/register/verify", userController.verifyMail)

router.get("/login", auth.isLogin, userController.loginLoad)

router.post("/login", userController.verifyLogin)

router.get("/home", auth.isLogin, userController.loadHome)

router.get("/logout", auth.isLogin, userController.userLogout)

router.get("/forget", userController.forgetLoad)

router.post("/forget", userController.forgetVerify)

router.get("/forget-password", auth.isLogin, userController.forgetPasswordLoad)

router.post("/forget-password", userController.resetPassword)

router.get("/verification", userController.verificationLoad)

router.post("/verification", userController.sentVerificationLink)

router.get("/productPage/:id", userController.productPage)

router.get("/productDetailPageLoad/:id", userController.productDetailPageLoad)

router.post("/update-quantity", cartController.updateQuantity)

router.post("/change-product-quantity", cartController.changeQuantity)

router.post("/update-quantity-Decrease", cartController.updateQuantityDecrease)

router.post("/addToCart", auth.isLogin, cartController.addToCart)

router.get("/cartPageLoad", auth.isLogin, cartController.getCartPage)

router.get("/userAccount", auth.isLogin, userController.userAccountLoad)

router.post("/delete-product", cartController.deleteFromCart)

router.get("/checkout", userController.checkoutPageLoad)

router.post("/add-address/:id", addressController.addAdress)

router.get("/makeDefaultAddress/:Id", addressController.makeDefaultAddress)

router.get("/useAddressCheckout/:Id", addressController.useAddressCheckout)

// router.post('/placeOrder',userController.placeOrder);

router.post("/submit-checkout", auth.isLogin, userController.submitCheckout)
 
router.post("/verify-payment", userController.verifyPayment)

router.get("/orderDetailView1/:id", orderController.orderDetailPageLoad)

router.post("/cancel-order", orderController.cancelOrder)

router.get("/orderPlaced", userController.successPageLoad)

router.post("/cancel-order", userController.cancelOrder)

router.post("/return-order", orderController.returnOrderUser)

router.post("/apply-coupon-request", couponController.applyCouponPOST)

router.get("/wallet-details", auth.isLogin, walletController.loadWallet)

router.get("/wallet-placedOrder", walletController.walletOrder)

router.get("/referAndEarn", auth.isLogin, userController.referAndEarnPageLoad)

router.get('/downloadInvoice/:id',auth.isLogin,userController.downloadInvoice)

module.exports = router
