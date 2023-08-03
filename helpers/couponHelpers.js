const User = require('../models/userModel');
const mongoose = require('mongoose');
const Coupon = require("../models/couponModel")
const UsedCoupon = require('../models/usedCouponModel')
const userController = require('../controllers/userController');
var adminController = require("../controllers/adminController");
const wallet = require("../models/walletModel");




const ObjectId = mongoose.Types.ObjectId;


module.exports = {
  getActiveCoupons: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const activeCoupons = await Coupon.find({ activeCoupon: true }).lean();

        resolve(activeCoupons);
      } catch (error) {
        console.log("Error from getActiveCoupons couponHelper :", error);

        reject(error);
      }
    });
  },

  getInActiveCoupons: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const inActiveCoupons = await Coupon.find({
          activeCoupon: false,
        }).lean();

        resolve(inActiveCoupons);
      } catch (error) {
        console.log("Error from getInActiveCoupons couponHelper :", error);

        reject(error);
      }
    });
  },

  verifyCouponExist: (newCouponData) => {
    return new Promise(async (resolve, reject) => {
      const couponCodeForVerification = newCouponData.couponCode.toLowerCase();

      try {
        const couponExist = await Coupon.find({
          couponCode: couponCodeForVerification,
        }).lean();

        if (couponExist.length === 0) {
          resolve({ status: true });
        } else {
          resolve({ duplicateCoupon: true });
        }
      } catch (error) {
        console.log("Error from verifyCouponExist couponHelper :", error);

        reject(error);
      }
    });
  },

  addNewCoupon: (newCouponData) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(newCouponData, "newCouponDatajjjjjjjjjjj");
        const couponCode = newCouponData.couponCode.toLowerCase();
        const usageCount = 0;
        const createdOn = new Date();
        const activeCoupon =
          newCouponData.activeCoupon === "true" ? true : false;
        const couponDescription = newCouponData.couponDescription;
        const discountPercentage = newCouponData.discountPercentage;
        const maxDiscountAmount = newCouponData.maxDiscountAmount;
        const minOrderValue = newCouponData.minOrderValue;
        const validFor = newCouponData.validFor;

        const couponData = new Coupon({
          couponCode: couponCode,
          couponDescription: couponDescription,
          discountPercentage: discountPercentage,
          maxDiscountAmount: maxDiscountAmount,
          minOrderValue: minOrderValue,
          validFor: validFor,
          activeCoupon: activeCoupon,
          usageCount: usageCount,
          createdOn: createdOn,
        });
        console.log(couponData, "couponDatavvvvvvvvvvvvvvvvvvvvvvv");

        const couponAddition = await couponData.save();

        console.log(couponAddition, "couponAdditionvvvvvvvvvvvvvvvvvvvvvvvvvv");

        resolve(couponAddition);
      } catch (error) {
        console.log("Error from addNewCoupon couponHelper :", error);

        reject(error);
      }
    });
  },

  getInActiveCoupons: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const inActiveCoupons = await Coupon.find({
          activeCoupon: false,
        }).lean();

        resolve(inActiveCoupons);
      } catch (error) {
        console.log("Error from getInActiveCoupons couponHelper :", error);

        reject(error);
      }
    });
  },

  getSingleCouponData: (couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const couponData = await Coupon.findOne({
          _id: new ObjectId(couponId),
        }).lean();
        // console.log(couponData,'couponDatavvvvvvvvvvvvvvvvvvvvv');

        resolve(couponData);
      } catch (error) {
        console.log("Error from getSingleCouponData couponHelper :", error);

        reject(error);
      }
    });
  },

  updateCouponData: (couponDataForUpdate, couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const couponCode = couponDataForUpdate.couponCode.toLowerCase(); // Converting the coupon code to lowercase to maintain uniform storage of codes and avoid duplicates due to vatiation in uppercase/lowercase
        const activeCoupon =
          couponDataForUpdate.activeCoupon === "true" ? true : false;
        const couponDescription = couponDataForUpdate.couponDescription;
        const discountPercentage = couponDataForUpdate.discountPercentage;
        const maxDiscountAmount = couponDataForUpdate.maxDiscountAmount;
        const minOrderValue = couponDataForUpdate.minOrderValue;
        const validFor = couponDataForUpdate.validFor;

        const couponUpdation = await Coupon.updateOne(
          { _id: couponId },
          {
            $set: {
              couponCode: couponCode,
              couponDescription: couponDescription,
              discountPercentage: discountPercentage,
              maxDiscountAmount: maxDiscountAmount,
              minOrderValue: minOrderValue,
              validFor: validFor,
              activeCoupon: activeCoupon,
            },
          }
        );

        resolve(couponUpdation);
      } catch (error) {
        console.log("Error from updateCouponData couponHelper :", error);

        reject(error);
      }
    });
  },

  getSingleCouponData: (couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const couponData = await Coupon.findOne({
          _id: new ObjectId(couponId),
        });

        resolve(couponData);
      } catch (error) {
        console.log("Error from getSingleCouponData couponHelper :", error);

        reject(error);
      }
    });
  },

  changeCouponStatus: (couponData, statusToModify) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (statusToModify === "Activate") {
          couponData.activeCoupon = true;
        } else if (statusToModify === "Deactivate") {
          couponData.activeCoupon = false;
        }
        const couponStatusUpdation = await Coupon.updateOne(
          { _id: new ObjectId(couponData._id) },
          { $set: couponData }
        );

        resolve(couponStatusUpdation);
      } catch (error) {
        console.log("Error from updateCouponData couponHelper :", error);

        reject(error);
      }
    });
  },


  /*===================================================================================================================================== */

  /* ----------------------------------===============USER SIDE Coupon Helpers===================---------------------------------------*/
   

  /*===================================================================================================================================== */
  
  
  getCouponDataByCouponCode: (couponCode) => {
    return new Promise(async (resolve, reject) => {
      try {
        const couponData = await Coupon.findOne({ couponCode: couponCode });
        console.log(couponData, "couponDataaaaaaaaaaa");
        if (couponData === null) {
          resolve({ couponNotFound: true });
        } else {
          resolve(couponData);
        }
      } catch (error) {
        console.log(
          "Error from getCouponDataByCouponCode couponHelper :",
          error
        );

        reject(error);
      }
    });
  },

  verifyCouponEligibility: (requestedCouponCode) => {
    return new Promise(async (resolve, reject) => {
      try {
        const couponData = await Coupon.findOne({
          couponCode: requestedCouponCode,
        });

        if (couponData === null) {
          resolve({
            status: false,
            reasonForRejection: "Coupon code dosen't exist",
          });
        } else {
          if (couponData.activeCoupon) {
            const couponExpiryDate = new Date(couponData.createdOn.getTime());

            couponExpiryDate.setDate(
              couponExpiryDate.getDate() + couponData.validFor
            );

            const currentDate = new Date();

            if (couponExpiryDate >= currentDate) {
              resolve({ status: true });
            } else {
              resolve({
                status: false,
                reasonForRejection: "Coupon code expired",
              });
            }
          } else {
            resolve({
              status: false,
              reasonForRejection: "Coupon currently un-available",
            });
          }
        }
      } catch (error) {
        console.log("Error from updateCouponData couponHelper :", error);

        reject(error);
      }
    });
  },

  verifyCouponUsedStatus: (userId, couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if coupon Exist or not
        const dbQuery = {
          userId: userId,

          usedCoupons: { $elemMatch: { couponId, usedCoupon: true } },
        };

        const previouslyUsedCoupon = await UsedCoupon.findOne({
          userId: userId,
          usedCoupons: { $elemMatch: { couponId, usedCoupon: true } },
        });

        if (previouslyUsedCoupon === null) {
          // Coupon is not used ever

          resolve({ status: true });
        } else {
          // Coupon is used already

          resolve({ status: false });
        }
      } catch (error) {
        console.log("Error from verifyCouponUsedStatus couponHelper :", error);

        reject(error);
      }
    });
  },

  applyCouponToCart: (userId, couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Step-1 ==> Disable any other coupons that have been applied earlier
        const updateResult = await UsedCoupon.updateMany(
          {
            userId: userId,
            usedCoupons: { $elemMatch: { appliedCoupon: true } },
          },
          { $set: { "usedCoupons.$[elem].appliedCoupon": false } },
          { arrayFilters: [{ "elem.appliedCoupon": true }] }
        );

        // Step-2 ==> Add the given coupon to users coupon history
        const userCouponHistory = await UsedCoupon.findOne({ userId: userId });
        if (userCouponHistory === null) {
          // If the user have no document in the coupons history collection
          const usedCoupon = new UsedCoupon({
            userId: userId,

            usedCoupons: [
              {
                couponId: couponId,

                appliedCoupon: true,

                usedCoupon: false,
              },
            ],
          });

          const insertNewCouponHistory = await usedCoupon.save();
          resolve({ status: true });
        } else {
          // If the user has a document in the coupons history collection, but don't have this coupon or this coupon is not applied yet
          const couponObjectExist = await UsedCoupon.findOne({
            userId: userId,
            usedCoupons: { $elemMatch: { couponId: couponId } },
          });
          if (couponObjectExist === null) {
            // Object containing Coupon code dosen't exist in the used coupons array
            const couponObjectExist = await UsedCoupon.updateOne(
              { userId: userId },
              {
                $push: {
                  usedCoupons: {
                    couponId: couponId,
                    appliedCoupon: true,
                    usedCoupon: false,
                  },
                },
              }
            );
            resolve({ status: true });
          } else {
            // Object containing Coupon code exist in the used coupons array, so update the applied coupon feild in the array object to true
            const couponObjectModified = await UsedCoupon.updateOne(
              {
                userId: userId,
                usedCoupons: { $elemMatch: { couponId: couponId } },
              },
              { $set: { "usedCoupons.$.appliedCoupon": true } }
            );
            resolve({ status: true });
          }
        }
      } catch (error) {
        console.log("Error from applyCouponToCart couponHelper :", error);

        reject(error);
      }
    });
  },


  

  
  
};