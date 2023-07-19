var express = require('express');
var router = express.Router();
const session = require('express-session')
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');


const auth = require('../middlewares/auth');

router.use(express.static('public'));



/* GET users listing. */

router.get('/',userController.loadHome)
  
router.get('/register',userController.loadSignup);

router.post('/register',userController.insertUser);

router.get('/register/verify', userController.verifyMail);


router.get('/login',auth.isLogin,userController.loginLoad);

router.post('/login',userController.verifyLogin);

router.get('/home',auth.isLogin,userController.loadHome);

router.get('/logout',auth.isLogin,userController.userLogout);

router.get('/forget',userController.forgetLoad);

router.post('/forget',userController.forgetVerify);

router.get('/forget-password', auth.isLogin,userController.forgetPasswordLoad);

router.post('/forget-password',userController.resetPassword);

router.get('/verification', userController.verificationLoad);

router.post('/verification',userController.sentVerificationLink);


router.get('/productPage/:categoryName',userController.productPage);

router.get('/productDetailPageLoad/:id',userController.productDetailPageLoad);

router.post('/update-quantity',cartController.updateQuantity);

router.post("/update-quantity-Decrease", cartController.updateQuantityDecrease);


router.post('/addToCart',auth.isLogin,cartController.addToCart);

router.get("/cartPageLoad", auth.isLogin, cartController.getCartPage);

router.get("/userAccount", auth.isLogin,userController.userAccountLoad);

router.post('/delete-product',cartController.deleteFromCart);

router.get("/checkout", userController.checkoutPageLoad);

router.post('/add-address/:id',userController.addAdress);

router.get("/makeDefaultAddress/:Id",userController.makeDefaultAddress);

router.get("/useAddressCheckout/:Id", userController.useAddressCheckout);

// router.post('/placeOrder',userController.placeOrder);

router.post('/submit-checkout',auth.isLogin,userController.submitCheckout);

router.post('/verify-payment',userController.verifyPayment);

router.get("/orderDetailView1/:id", userController.orderDetailPageLoad);







module.exports = router;
  