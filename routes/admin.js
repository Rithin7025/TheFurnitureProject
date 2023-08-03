const express = require('express');
const router = express.Router();
const session = require('express-session');
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/adminAuth');
const multer = require('multer');
const upload = require('../middlewares/middlewareFileUpload')
const adminAuth = require('../middlewares/adminAuth');
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController =  require('../controllers/orderController');
const couponController = require('../controllers/couponController')
const bannerContoller = require('../controllers/bannerController')



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

router.get('/category',categoryController.showCategoryTable);

router.post('/category',upload.single('categoryImage'),categoryController.addCategory);
    
router.get('/product',productController.ProductPageLoad);

router.post('/product',upload.array('productImage',4),productController.addProduct);

router.get('/unlist/:id',categoryController.hideCategory);

router.get('/list/:id',categoryController.unhideCategory);

router.post("/hideUnhideProduct/:id",adminController.hideUnhideProduct);


// router.get('/hideProduct/:id',adminController.hideProduct);

// router.get('/displayProduct/:id',adminController.displayProduct);

router.get('/editProduct/:id',productController.editProductload);

router.get("/editCategory/:id",categoryController.editCategoryload);

router.post('/editCategory/:id',upload.single('categoryImage'),categoryController.editCategory)

router.post('/editProduct/:id',upload.array('newProductImage',4),productController.editProduct);

router.get('/allOrders',orderController.getOrderDetails);

router.get("/adminOrderDetailView", orderController.adminOrderDetailView);

router.post("/orderconfirmation", orderController.orderConfirmation);

router.post("/deliver-by-admin", orderController.orderDeliver);

router.post("/cancel-by-admin", orderController.cancelledByAdmin);

router.post("/reject-by-admin", orderController.rejectCancellation);

router.post("/accept-return",orderController.adminAcceptReturn);

router.post("/reject-return", orderController.adminRejectReturn);


router.get("/salesPage",adminController.loadSalesPage);



router.get('/getTodaySales',adminAuth.isLogin,adminController.getSalesToday)
router.get('/getWeekSales',adminAuth.isLogin,adminController.getWeekSales)
router.get('/getMonthlySales',adminAuth.isLogin,adminController.getMonthSales)
router.get('/getYearlySales',adminAuth.isLogin,adminController.getYearlySales)
router.post('/salesWithDate',adminController.salesWithDate)

router.get('/salesReport',adminAuth.isLogin,adminController.downloadSalesReport)




router.get('/add-coupon',adminAuth.isLogin, couponController.addNewCouponGET);
router.post('/add-coupon', couponController.addNewCouponPOST);
router.get('/manage-coupons',adminAuth.isLogin, couponController.manageCoupon);
router.get('/inactive-coupons',adminAuth.isLogin,couponController.inactiveCouponsGET);
router.get('/edit-coupon',adminAuth.isLogin, couponController.editCouponGET);
router.post('/update-coupon',couponController.updateCouponPOST)
router.post('/change-coupon-status',couponController.changeCouponStatusPOST)

router.get('/add-banner',bannerContoller.getBannerPageLoad)

router.post("/add-banner",upload.single('bannerImage'),bannerContoller.bannerDetailsAdd);


 





router.get("/bannerlistUnlist/:id", bannerContoller.listUnlistBanner);
   

// router.get('*', function(req, res) {
//   res.redirect('/admin');
// });


module.exports = router;
