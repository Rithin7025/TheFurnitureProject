const User = require("../models/userModel");
const mongoose = require("mongoose");
const Coupon = require("../models/couponModel");
const UsedCoupon = require("../models/usedCouponModel");
const userController = require("../controllers/userController");
var adminController = require("../controllers/adminController");
const wallet = require("../models/walletModel");

const ObjectId = mongoose.Types.ObjectId;

module.exports = {
  checkCurrentCouponValidityStatus: (userId, cartValue) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if coupon Exist or not
        const existingAppledCoupon = await UsedCoupon.findOne({
          userId: userId,
          usedCoupons: { $elemMatch: { appliedCoupon: true } },
        });
        if (existingAppledCoupon === null) {
          resolve({ status: false, couponDiscount: 0 });
        } else {
          // Applied Coupon Exist
          const activeCoupon = existingAppledCoupon.usedCoupons.find(
            (coupon) => coupon.appliedCoupon === true
          );

          const activeCouponId = activeCoupon.couponId.toString();

          const activeCouponData = await Coupon.findOne({
            _id: new ObjectId(activeCouponId),
          });

          const minimumOrderValue = parseInt(activeCouponData.minOrderValue);

          // ============================= Check if coupon previously used by the user =============================

          const previouslyUsedCoupon = await UsedCoupon.findOne({
            userId: userId,
            usedCoupons: {
              $elemMatch: { couponId: activeCoupon.couponId, usedCoupon: true },
            },
          });
          // ================= Check if the coupon is a active coupon =================
          if (activeCouponData.activeCoupon) {
            // The provided Coupon is a active coupon

            if (previouslyUsedCoupon === null) {
              // Coupon is not used ever
              if (cartValue >= minimumOrderValue) {
                const couponExpiryDate = new Date(
                  activeCouponData.createdOn.getTime()
                );

                couponExpiryDate.setDate(
                  couponExpiryDate.getDate() +
                    parseInt(activeCouponData.validFor)
                );

                const currentDate = new Date();
                // =================== Check if current date is lesser than the coupon expiry date ===================
                if (couponExpiryDate >= currentDate) {
                  // Coupon is valid considering the expiry date
                  // Calculating eligible Discount Amount considering the cart total
                  const discountPercentage = parseInt(
                    activeCouponData.discountPercentage
                  );

                  const discountAmountForCart =
                    cartValue * (discountPercentage / 100);

                  // Fixing maximum eligible discount amount
                  const maximumCouponDiscountAmount = parseInt(
                    activeCouponData.maxDiscountAmount
                  );

                  let eligibleCouponDiscountAmount = 0;

                  if (discountAmountForCart >= maximumCouponDiscountAmount) {
                    eligibleCouponDiscountAmount = maximumCouponDiscountAmount;
                  } else {
                    eligibleCouponDiscountAmount = discountAmountForCart;
                  }
                  // =================== Resolving all the coupon Discount Data of Eligible Coupon ===================
                  resolve({
                    status: true,
                    couponId: activeCouponId,
                    couponDiscount: eligibleCouponDiscountAmount,
                  });
                } else {
                  // Coupon last use date exceeded, so coupon is invalid considering the expiry date

                  resolve({
                    status: false,
                    couponId: activeCouponId,
                    couponDiscount: 0,
                  });
                }
              } else {
                // Coupon is invalid considering the cart amount

                resolve({
                  status: false,
                  couponId: activeCouponId,
                  couponDiscount: 0,
                });
              }
            } else {
              // Coupon is used already

              resolve({
                status: false,
                couponId: activeCouponId,
                couponDiscount: 0,
              });
            }
          } else {
            // The given coupon is a deactivated coupon

            resolve({
              status: false,
              couponId: activeCouponId,
              couponDiscount: 0,
            });
          }
        }
      } catch (error) {
        console.log(
          "Error from checkCurrentCouponValidityStatus couponHelper :",
          error
        );

        reject(error);
      }
    });
  },
  checkCurrentCouponValidityStatus: (userId, cartValue) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if coupon Exist or not
        const existingAppledCoupon = await UsedCoupon.findOne({
          userId: userId,
          usedCoupons: { $elemMatch: { appliedCoupon: true } },
        });
        if (existingAppledCoupon === null) {
          resolve({ status: false, couponDiscount: 0 });
        } else {
          // Applied Coupon Exist
          const activeCoupon = existingAppledCoupon.usedCoupons.find(
            (coupon) => coupon.appliedCoupon === true
          );

          const activeCouponId = activeCoupon.couponId.toString();

          const activeCouponData = await Coupon.findOne({
            _id: new ObjectId(activeCouponId),
          });

          const minimumOrderValue = parseInt(activeCouponData.minOrderValue);

          // ============================= Check if coupon previously used by the user =============================

          const previouslyUsedCoupon = await UsedCoupon.findOne({
            userId: userId,
            usedCoupons: {
              $elemMatch: { couponId: activeCoupon.couponId, usedCoupon: true },
            },
          });
          // ================= Check if the coupon is a active coupon =================
          if (activeCouponData.activeCoupon) {
            // The provided Coupon is a active coupon

            if (previouslyUsedCoupon === null) {
              // Coupon is not used ever
              if (cartValue >= minimumOrderValue) {
                const couponExpiryDate = new Date(
                  activeCouponData.createdOn.getTime()
                );

                couponExpiryDate.setDate(
                  couponExpiryDate.getDate() +
                    parseInt(activeCouponData.validFor)
                );

                const currentDate = new Date();
                // =================== Check if current date is lesser than the coupon expiry date ===================
                if (couponExpiryDate >= currentDate) {
                  // Coupon is valid considering the expiry date
                  // Calculating eligible Discount Amount considering the cart total
                  const discountPercentage = parseInt(
                    activeCouponData.discountPercentage
                  );

                  const discountAmountForCart =
                    cartValue * (discountPercentage / 100);

                  // Fixing maximum eligible discount amount
                  const maximumCouponDiscountAmount = parseInt(
                    activeCouponData.maxDiscountAmount
                  );

                  let eligibleCouponDiscountAmount = 0;

                  if (discountAmountForCart >= maximumCouponDiscountAmount) {
                    eligibleCouponDiscountAmount = maximumCouponDiscountAmount;
                  } else {
                    eligibleCouponDiscountAmount = discountAmountForCart;
                  }
                  // =================== Resolving all the coupon Discount Data of Eligible Coupon ===================
                  resolve({
                    status: true,
                    couponId: activeCouponId,
                    couponDiscount: eligibleCouponDiscountAmount,
                  });
                } else {
                  // Coupon last use date exceeded, so coupon is invalid considering the expiry date

                  resolve({
                    status: false,
                    couponId: activeCouponId,
                    couponDiscount: 0,
                  });
                }
              } else {
                // Coupon is invalid considering the cart amount

                resolve({
                  status: false,
                  couponId: activeCouponId,
                  couponDiscount: 0,
                });
              }
            } else {
              // Coupon is used already

              resolve({
                status: false,
                couponId: activeCouponId,
                couponDiscount: 0,
              });
            }
          } else {
            // The given coupon is a deactivated coupon

            resolve({
              status: false,
              couponId: activeCouponId,
              couponDiscount: 0,
            });
          }
        }
      } catch (error) {
        console.log(
          "Error from checkCurrentCouponValidityStatus couponHelper :",
          error
        );

        reject(error);
      }
    });
  },
  updateCouponUsedStatus: (userId, couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const requestedUserId = new ObjectId(userId);

        const requestedCouponId = new ObjectId(couponId);

        // Check if coupon Exist or not

        const findAppliedCoupon = await UsedCoupon.findOne({
          userId: requestedUserId,
          usedCoupons: { $elemMatch: { couponId: requestedCouponId } },
        });

        if (findAppliedCoupon) {
          // Coupon exists, update the usedCoupon value to true
          const couponUpdateStatus = await UsedCoupon.updateOne(
            {
              userId: requestedUserId,
              usedCoupons: { $elemMatch: { couponId: requestedCouponId } },
            },
            { $set: { "usedCoupons.$.usedCoupon": true } }
          );

          resolve({ status: true }); // Resolve the promise after updating the status
        } else {
          reject(new Error("Coupon not found")); // Reject the promise if coupon does not exist
        }
      } catch (error) {
        console.log("Error from updateCouponUsedStatus couponHelper :", error);

        reject(error);
      }
    });
  },
};