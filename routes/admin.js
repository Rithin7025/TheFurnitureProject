const express = require('express');
const router = express.Router();
const session = require('express-session');
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/adminAuth');
const multer = require('multer');
const upload = require('../middlewares/middlewareFileUpload')
const adminAuth = require('../middlewares/adminAuth')



router.use(express.json());
router.use(express.urlencoded({extended : true}));



/* GET home page. */
router.get('/',adminAuth.isLogout,adminController.loadLogin);

router.get('/productApi',adminController.productsDisplay);

router.post('/',adminController.verifyLogin);

router.get('/home',adminAuth.isLogin,adminController.loadDashboard);

router.get('/logout',adminAuth.isLogin,adminController.adminLogout);

router.get('/usersList',adminController.usersListLoad);

router.get('/blockUser/:id',adminAuth.isLogin, adminController.blockUser);

router.get('/unblockUser/:id',adminAuth.isLogin,adminController.unblockUser);

router.get('/category',adminController.showCategoryTable);

router.post('/category',upload.single('categoryImage'),adminController.addCategory);
    
router.get('/product',adminController.ProductPageLoad);

router.post('/product',upload.array('productImage',4),adminController.addProduct);

router.get('/unlist/:id',adminController.hideCategory);

router.get('/list/:id',adminController.unhideCategory);

router.post("/hideUnhideProduct/:id",adminController.hideUnhideProduct);


// router.get('/hideProduct/:id',adminController.hideProduct);

// router.get('/displayProduct/:id',adminController.displayProduct);

router.get('/editProduct/:id',adminController.editProductload);

router.post('/editProduct/:id',upload.array('newProductImage',4),adminController.editProduct);

router.get('/allOrders',adminController.getOrderDetails);








   

// router.get('*', function(req, res) {
//   res.redirect('/admin');
// });


module.exports = router;
