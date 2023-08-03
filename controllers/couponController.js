const Category = require("../models/categoryModel");
const Product = require("../models/productModel");

const productHelper = require("../helpers/productHelper");
const userHelpers = require("../helpers/userHelpers");
const Order = require("../models/orderModel");
const Razorpay = require("razorpay");
const moment = require("moment-timezone");


const User = require("../models/userModel");
const mongoose = require("mongoose");
const Coupon = require("../models/couponModel");
const couponHelpers = require("../helpers/couponHelpers");
const UsedCoupon = require("../models/usedCouponModel");
const userController = require("../controllers/userController");
// const Wallet = require("../models/walletModel");

const manageCoupon = async (req, res) => {
  try {
    const admin = req.session.is_admin;
    const adminData = await User.find({ is_admin: admin });

    console.log(adminData, "adminDataaaaaaa");
    console.log("finddddddddddddddddddd");
    const activeCoupons = await couponHelpers.getActiveCoupons();
    const inActiveCoupons = await couponHelpers.getInActiveCoupons();

    const dataToRender = {
      adminData,
      activeCoupons,
      inActiveCoupons,
    };

    res.render("admin/coupon-manage", dataToRender);
  } catch (error) {
    console.log(error.message);
  }
};

const addNewCouponGET = async (req, res) => {
  try {
    const admin = req.session.is_admin;
    const adminData = await User.find({ is_admin: admin });

    let couponExistError = false;

    if (req.session.couponExistError) {
      couponExistError = req.session.couponExistError;
    }

    res.render("admin/coupon-add");

    delete req.session.couponExistError;
  } catch (error) {
    console.log("Error from addNewCouponGET couponController :", error.message);

    res.redirect("/admin/admin-error");
  }
};

const addNewCouponPOST = async (req, res) => {
  try {
    const admin = req.session.is_admin;
    const adminData = await User.find({ is_admin: admin });

    const newCouponData = req.body;

    const couponExist = await couponHelpers.verifyCouponExist(newCouponData);

    if (couponExist.status) {
      const couponAddingStatus = await couponHelpers.addNewCoupon(
        newCouponData
      );

      res.redirect("/admin/add-coupon");
    } else if (couponExist.duplicateCoupon) {
      req.session.couponExistError =
        "Coupon code already exist, try some other code";

      res.redirect("/admin/add-coupon");
    }
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/admin-error");
  }
};

const inactiveCouponsGET = async (req, res) => {
  try {
    const admin = req.session.is_admin;
    const adminData = await User.find({ is_admin: admin });

    const inActiveCoupons = await couponHelpers.getInActiveCoupons();

    const dataToRender = {
      adminData,
      inActiveCoupons,
    };

    res.render("admin/coupon-deactivated", dataToRender);
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/admin-error");
  }
};

const editCouponGET = async (req, res) => {
  try {
    const admin = req.session.is_admin;
    const adminData = await User.find({ is_admin: admin });

    let couponExistError = false;

    if (req.session.couponExistError) {
      couponExistError = req.session.couponExistError;
    }
    const couponId = req.query.id;
    // console.log(couponId,'couponIddddddddddddddddd');

    const couponData = await couponHelpers.getSingleCouponData(couponId);

    // console.log(couponData,'couponDatabbbbbbbbbbbbbbb');

    const dataToRender = {
      adminData,
      couponExistError,
      couponData,
    };

    res.render("admin/coupon-edit", dataToRender);

    delete req.session.couponExistError;
  } catch (error) {
    console.log("Error from editCouponPOST couponController :", error.message);

    res.redirect("/admin/admin-error");
  }
};

const updateCouponPOST = async (req, res) => {
  try {
    const admin = req.session.is_admin;
    const adminData = await User.find({ is_admin: admin });

    const couponDataForUpdate = req.body;

    const couponId = couponDataForUpdate.couponId;

    const couponExist = await couponHelpers.verifyCouponExist(
      couponDataForUpdate
    );

    if (couponExist.status) {
      const couponUpdateStatus = await couponHelpers.updateCouponData(
        couponDataForUpdate,
        couponId
      );

      res.redirect("/admin/manage-coupons");
    } else if (couponExist.duplicateCoupon) {
      req.session.couponExistError =
        "Coupon code already exist, try some other code";

      res.redirect("/admin/edit-coupon/?id=" + couponId);
    }
  } catch (error) {
    console.log(
      "Error-2 from updateCouponPOST couponController :",
      error.message
    );

    res.redirect("/admin/admin-error");
  }
};

const changeCouponStatusPOST = async (req, res) => {
  try {
    const admin = req.session.is_admin;
    const adminData = await User.find({ is_admin: admin });

    const couponId = req.body.couponId;

    const couponData = await couponHelpers.getSingleCouponData(couponId);

    if (couponData.activeCoupon) {
      const couponUpdateStatus = await couponHelpers.changeCouponStatus(
        couponData,
        "Deactivate"
      );
      res.redirect("/admin/manage-coupons");
    } else if (!couponData.activeCoupon) {
      const couponUpdateStatus = await couponHelpers.changeCouponStatus(
        couponData,
        "Activate"
      );
      res.redirect("/admin/inactive-coupons");
    } else {
      console.log(
        "Error-2 from changeCouponStatusPOST Controller: ",
        couponUpdateStatus
      );
    }
  } catch (error) {
    console.log(
      "Error-3 from changeCouponStatusPOST couponController :",
      error.message
    );

    res.redirect("/admin/admin-error");
  }
};

/*==========================================================User side Coupon Controllers================================================================= */

const applyCouponPOST = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const couponCode = req.body.couponCodeFromUser.toLowerCase();
    const couponData = await couponHelpers.getCouponDataByCouponCode(
      couponCode
    );
    
    const couponEligible = await couponHelpers.verifyCouponEligibility(
      couponCode
    );

    if (couponEligible.status) {
      const cartValue = await userHelpers.getCartValue(userId);
      if (cartValue >= couponData.minOrderValue) {
        const userEligible = await couponHelpers.verifyCouponUsedStatus(

          userId,
          couponData._id
        );
        if (userEligible.status) {
          const applyNewCoupon = await couponHelpers.applyCouponToCart(
            userId,
            couponData._id
          );
          if (applyNewCoupon.status) {
            req.session.couponApplied = "Congrats, Coupon applied succesfully";

            res.redirect("/checkout");
          } else {
            req.session.couponInvalidError =
              "Sorry, Unexpected Error in applying coupon";

            res.redirect("/checkout");
          }
        } else {
          req.session.couponInvalidError = "Coupon already used earlier";

          res.redirect("/checkout");
        }
      } else {
        req.session.couponInvalidError =
          "Coupon not applied, purchase minimum for ₹" +
          couponData.minOrderValue +
          " to get coupon";

        res.redirect("/checkout");
      }
    } else if (couponEligible.reasonForRejection) {
      req.session.couponInvalidError = couponEligible.reasonForRejection;

      res.redirect("/checkout");
    }
  } catch (error) {
    console.log(
      "Error-3 from changeCouponStatusPOST couponController :",
      error.message
    );
    res.redirect("/user-error");
  }
};






module.exports = {
  manageCoupon,
  addNewCouponGET,
  addNewCouponPOST,
  inactiveCouponsGET,
  editCouponGET,
  updateCouponPOST,
  changeCouponStatusPOST,
  applyCouponPOST,
};