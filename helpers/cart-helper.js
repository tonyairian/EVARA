const { response } = require("express");
const { ObjectId } = require("mongodb");
const { user, product, coupon } = require("../model/connection");
const db = require("../model/connection");
const CC = require("currency-converter-lt");
const moment = require("moment");
require("dotenv").config();
const Razorpay = require("razorpay");
const { resolve } = require("path");
var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

const addToCart = (userId, productId) => {
  let proObj = {
    item: productId,
    quantity: 1,
  };
  return new Promise(async (resolve, reject) => {
    let userCart = await db.cart.findOne({ user: userId });
    if (userCart) {
      let proExist = userCart.cartProducts.findIndex(
        (cartProducts) => cartProducts.item == productId
      );
      if (proExist != -1) {
        db.cart
          .updateOne(
            { user: userId, "cartProducts.item": productId },
            {
              $inc: { "cartProducts.$.quantity": 1 },
            }
          )
          .then(() => {
            resolve();
          });
      } else {
        db.cart
          .updateOne(
            { user: userId },
            {
              $push: {
                cartProducts: proObj,
              },
            }
          )
          .then(() => {
            resolve();
          })
          .catch((err) => console.log(err));
      }
    } else {
      let cartObj = {
        user: userId,
        cartProducts: [proObj],
      };
      db.cart(cartObj)
        .save()
        .then(() => {
          resolve();
        })
        .catch((err) => console.log(err));
    }
  });
};

//show the products in the user cart in cart page
const getCartProducts = (userId) => {
  return new Promise(async (resolve, reject) => {
    await db.cart
      .aggregate([
        { $match: { user: userId } },
        {
          $unwind: "$cartProducts",
        },
        {
          $project: {
            item: "$cartProducts.item",
            quantity: "$cartProducts.quantity",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "cartItems",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            status: "placed",
            Product: { $arrayElemAt: ["$cartItems", 0] },
          },
        },
      ])
      .then((cartItems) => {
        resolve(cartItems);
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

//show/update the count of items in the user cart and displays it in the cart icon
const getCartCount = (userId) => {
  return new Promise(async (resolve, reject) => {
    let cartCount = 0;
    let cart = await db.cart.findOne({ user: userId });
    // console.log(cart);
    if (cart) {
      cartCount = cart.cartProducts.length;
      // console.log(cartCount);
    }
    resolve(cartCount);
  });
};

const changeProductQuantity = (cartId, productId, count, quantity) => {
  count = parseInt(count);
  quantity = parseInt(quantity);
  return new Promise(async (resolve, reject) => {
    if (count == -1 && quantity == 1) {
      db.cart
        .updateOne(
          { _id: cartId },
          {
            $pull: { cartProducts: { item: productId } },
          }
        )
        .then((response) => {
          console.log(response);
          resolve({ removeProduct: true });
        });
    } else {
      await db.cart
        .updateOne(
          { _id: cartId, "cartProducts.item": productId },
          {
            $inc: { "cartProducts.$.quantity": count },
          }
        )
        .then((response) => {
          // console.log(response);
          resolve(response);
        });
    }
  });
};

const deleteProductFromCart = (proId, cartId) => {
  return new Promise(async (resolve, reject) => {
    await db.cart
      .updateOne(
        { _id: cartId },
        {
          $pull: {
            cartProducts: { item: proId },
          },
        }
      )
      .then((result) => {
        resolve({ productRemoved: true });
      });
  });
};

const getTotalAmount = (userId) => {
  return new Promise(async (resolve, reject) => {
    db.cart
      .aggregate([
        {
          $match: {
            user: userId,
          },
        },
        {
          $unwind: "$cartProducts",
        },
        {
          $project: {
            item: "$cartProducts.item",
            quantity: "$cartProducts.quantity",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "cartItems",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ["$cartItems", 0] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$product.price", "$quantity"] } },
          },
        },
      ])
      .then((total) => {
        // resolve(total[0]?.total);
        let totalAmount = total[0]?.total;

        resolve(totalAmount);
      });
  });
};

const placeOrder = (userDetails, products, total, user, userId) => {
  return new Promise(async (resolve, reject) => {
    let status = userDetails.paymentMethod === "COD" ? "placed" : "pending";
    const address = userDetails.address.toString();
    let Details = {
      name: userDetails.name,
      address: address,
      city: userDetails.city,
      state: userDetails.state,
      pincode: userDetails.pincode,
      phone: userDetails.phone,
      date: new Date().toDateString(),
      email: userDetails.email,
    };
    const cartProducts = await db.cart.findOne({ user: userId });
    let orderObj = {
      date: new Date().toISOString(),
      orderDate: moment().format("YYYY-MM-D"),
      orderMonth: moment().format("YYYY-MM"),
      orderYear: moment().format("YYYY"),
      user: userId,
      paymentMethod: userDetails.paymentMethod,
      status: status,
      total: total,
      deliveryDetails: [Details],
      products: products,
      coupon: userDetails.couponName,
    };

    if (userDetails.couponName) {
      let USERID = {
        userId: userId,
      };
      await db.coupon.updateOne(
        { coupanId: userDetails.couponName },
        {
          $push: {
            userData: [USERID],
          },
        }
      );
    }

    db.order(orderObj)
      .save()
      .then((orderDetails) => {
        resolve(orderDetails);
      });
  });
};

const deliveryDetails = (userId) => {
  return new Promise(async (resolve, reject) => {
    let productDetails = await db.order.aggregate([
      {
        $match: { user: userId },
      },
      {
        $unwind: "$products",
      },
      {
        $unwind: "$deliveryDetails",
      },
      {
        $project: {
          item: "$products.item",
          quantity: "$products.quantity",
          date: "$deliveryDetails.date",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "item",
          foreignField: "_id",
          as: "orderedProducts",
        },
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          date: 1,
          product: { $arrayElemAt: ["$orderedProducts", 0] },
        },
      },
    ]);
    resolve(productDetails);
  });
};

const generateRazorpay = async (userId, total) => {
  const orderDetailes = await db.order.find({ userId: userId });
  let lastOrder = orderDetailes.length - 1;
  let orderId = orderDetailes[lastOrder]._id;
  total = total * 100;
  return new Promise((resolve, reject) => {
    try {
      var options = {
        amount: total,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log("razerpayErr:" + err);
        }
        order.name = orderDetailes[0].deliveryDetails[0].name;
        order.email = orderDetailes[0].deliveryDetails[0].email;
        order.phone = orderDetailes[0].deliveryDetails[0].phone;

        resolve(order);
      });
    } catch (err) {
      console.log(err);
    }
  });
};

const verifypayment = (data) => {
  return new Promise((resolve, reject) => {
    const crypto = require("crypto");
    let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);
    hmac.update(
      data["payment[razorpay_order_id]"] +
        "|" +
        data["payment[razorpay_payment_id]"]
    );
    hmac = hmac.digest("hex");
    if (hmac == data["payment[razorpay_signature]"]) {
      resolve();
    } else {
      reject("not match");
    }
  });
};
const getProducts = (proId) => {
  return new Promise(async (resolve, reject) => {
    await db.product.findOne({ _id: ObjectId(proId) }).then((response) => {
      resolve(response);
    });
  });
};
const getWishlistCount = (userId) => {
  return new Promise(async (resolve, reject) => {
    let wishlistCount = 0;
    let wishlist = await db.wishlist.findOne({ user: userId });
    // console.log(cart);
    if (wishlist) {
      wishlistCount = wishlist.products.length;
      // console.log(cartCount);
    }
    resolve(wishlistCount);
  });
};

const convertRate = (totalinr) => {
  let fromCurrency = "INR";
  let toCurrency = "USD";
  let amountToConvert = totalinr;
  let currencyConverter = new CC({
    from: fromCurrency,
    to: toCurrency,
    amount: amountToConvert,
  });
  return new Promise(async (resolve, reject) => {
    await currencyConverter
      .convert()
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
};


const deleteCartProducts = async (userId) => {
  let cartCoupon = await db.cart.findOne({ user: userId });

  if (cartCoupon) {
    let code = cartCoupon.couponApplied;
    await db.coupon
      .updateOne(
        { couponCode: code },
        {
          $push: {
            userData: userId,
          },
        }
      )
      .then(() => {
        db.cart
          .deleteOne({ user: userId })
          .then((cartDeleted) => {
            resolve(cartDeleted);
          })
          .catch((err) => {});
      });
  } else {
    db.cart
      .deleteOne({ user: userId })
      .then((cartDeleted) => {
        resolve(cartDeleted);
      })
      .catch((err) => {});
  }
};
const userCart = (userId) => {
  return new Promise(async (resolve, reject) => {
    await db.cart
      .findOne({ user: ObjectId(userId) })
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

const getProductPrice = async (productId) => {
  return new Promise(async (resolve, reject) => {
    const result = await db.product.findOne({ _id: productId });
    resolve(result);
  });
};

const applyCoupon = (details, userId, date, totalAmount) => {
  return new Promise(async (resolve, reject) => {
    let response = {};
    let coupon = await db.coupon.findOne({ coupanId: details.coupon });
    if (coupon) {
      const expDate = new Date(coupon.expiryDate);
      response.couponData = coupon;
      let userFound = await db.coupon.findOne({
        coupanId: details.coupon,
        userData: { $elemMatch: { userId: userId } },
      });
      // console.log("0000000000");
      // console.log(userFound);
      // console.log("0000000000");
      if (userFound) {
        response.used = "Coupon Already Applied";
        resolve(response);
      } else {
        if (date <= expDate) {
          response.dateValid = true;
          resolve(response);
          let total = totalAmount;
          if (total >= coupon.price) {
            response.verifyMinAmount = true;
            resolve(response);

            if (total <= coupon.max) {
              response.verifyMaxAmount = true;
              resolve(response);
            } else {
              response.maxAmountMsg =
                "Your Maximum Purchase should be " + coupon.max;
              response.maxAmount = true;
              resolve(response);
            }
          } else {
            response.minAmountMsg =
              "Your Minimum purchase should be " + coupon.price;
            response.minAmount = true;
            resolve(response);
          }
        } else {
          response.invalidDateMsg = "coupon Expired";
          response.invalidDate = true;
          response.Coupenused = false;
          resolve(response);
        }
      }
    } else {
      response.invalidCoupon = true;
      response.invalidCouponMsg = "Invalid coupon";
      resolve(response);
    }

    if (
      response.dateValid &&
      response.verifyMaxAmount &&
      response.verifyMinAmount
    ) {
      response.verify = true;
      db.cart
        .updateOne(
          { user: ObjectId(userId) },
          {
            $set: {
              coupon: ObjectId(coupon._id),
            },
          }
        )
        .then((response) => {});
      resolve(response);
    }
  });
};

const couponVerify = (user) => {
  return new Promise(async (resolve, reject) => {
    let userCart = await db.cart.findOne({ user: user });
    if (userCart?.coupon) {
      let couponData = await db.coupon.findOne({
        _id: ObjectId(userCart.coupon),
      });
      resolve(couponData);
    }
    resolve(userCart);
  });
};

module.exports = {
  addToCart,
  getCartProducts,
  getCartCount,
  changeProductQuantity,
  deleteProductFromCart,
  getTotalAmount,
  placeOrder,
  deliveryDetails,
  verifypayment,
  generateRazorpay,
  getProducts,
  getWishlistCount,
  convertRate,
  deleteCartProducts,
  userCart,
  getProductPrice,
  applyCoupon,
  couponVerify,
};
