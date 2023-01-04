const { response } = require("express");
const userHelper = require("../helpers/user-helper");
const cartHelper = require("../helpers/cart-helper");
const { product, user } = require("../model/connection");
const wishlistHelper = require("../helpers/wishlist-helper");
require("dotenv").config();
let YOUR_ACCOUNT_SID = process.env.ACCOUNT_SID;
let YOUR_AUTH_TOKEN = process.env.AUTH_TOKEN;
let YOUR_SERVICE_ID = process.env.SERVICE_ID;
var client = require("twilio")(YOUR_ACCOUNT_SID, YOUR_AUTH_TOKEN);

const db = require("../model/connection");

const userSignup = (req, res) => {
  userHelper.userSignup(req.body).then((response) => {
    if (response) {
      res.redirect("/login");
    } else {
      res.redirect("/signup");
    }
  });
};

const landingPage = async (req, res) => {
  let cartCount = null;
  let banners = await userHelper.getBanner();

  if (req.session.user) {
    const userId = req.session.user._id;
    cartCount = await cartHelper.getCartCount(userId);
    wishlistCount = await cartHelper.getWishlistCount(userId);
  } else {
    wishlistCount = null;
  }
  let catCount = await userHelper.getCatCount();
  let productArray = new Array();
  for (i = 0; i < catCount.length; i++) {
    let prod = await userHelper.getCategory(catCount[i]._id);
    productArray.push(prod);
  }
  console.log(productArray);
  //RENDER HOME PAGE
  userHelper.getProducts().then((product) => {
    let user = req.session.user;
    res.render("user/index", {
      user,
      product,
      cartCount,
      wishlistCount,
      productArray,
      banners,
    });
  });
};

const viewCategoryProducts = async (req, res) => {
  let cartCount = null;
  wishlistCount = null;
  let user = req.session.user;
  if (req.session.user) {
    const userId = req.session.user._id;
    cartCount = await cartHelper.getCartCount(userId);
    wishlistCount = await cartHelper.getWishlistCount(userId);
  }
  const catId = req.query.id;
  const products = await userHelper.viewCategoryProducts(catId);
  console.log(products);
  req.session.returnTo = req.originalUrl;
  res.render("user/category-products", {
    user,
    cartCount,
    wishlistCount,
    products,
  });
};

const loginPage = (req, res) => {
  if (req.session.user) {
    res.header("cache-control", "private,no-cache,no-store,must revalidate");
    res.redirect("/");
  } else {
    let user = false;
    res.render("user/login", {
      signupPage,
      user,
      loginErr: req.session.loginErr,
      isBlocked: req.session.isBlocked,
    });
  }
};

const signupPage = (req, res) => {
  let user = false;
  res.render("user/signup", { user });
};
const userLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.send(err, "error");
    } else {
      res.redirect("/");
    }
  });
};
const otpLogin = (req, res) => {
  let user = false;
  res.render("user/otp-login", { user });
};

const getOtplogin = (req, res) => {
  client.verify
    .services(YOUR_SERVICE_ID)
    .verifications.create({
      to: `+${req.query.phoneNumber}`,
      channel: req.query.channel,
    })
    .then((data) => {
      res.status(200).send(data);
      console.log(data);
    });
};

const getOtpverify = (req, res) => {
  client.verify
    .services(YOUR_SERVICE_ID)
    .verificationChecks.create({
      to: `+${req.query.phoneNumber}`,
      code: req.query.code,
    })
    .then(async (data) => {
      console.log("=>", data);
      if (data.valid) {
        let Number = data.to.slice(3);
        let userData = await db.user.findOne({ phonenumber: Number });
        console.log("hihihi", userData);
        req.session.user = userData;

        res.send({ value: "success" });
      } else {
        res.send({ value: "failed" });
      }
    });
};

const viewProduct = async (req, res) => {
  const id = req.query.id;
  let user = req.session.user;
  req.session.returnTo = req.originalUrl;
  console.log(req.session.returnTo);
  wishlistCount = null;
  if (user) {
    const userId = req.session.user._id;
    let cartCount = await cartHelper.getCartCount(userId);
    wishlistCount = await cartHelper.getWishlistCount(userId);
    userHelper.viewProduct(id).then((product) => {
      res.render("user/product", {
        user,
        product,
        cartCount,
        wishlistCount,
      });
    });
  } else {
    let user = false;
    const cartCount = 0;
    const product = await userHelper.viewProduct(id);
    res.render("user/product", { product, user, cartCount });
  }
};

//create new cart or push to cart
const addToCart = (req, res) => {
  const userId = req.session.user._id;
  const productId = req.query.id;
  cartHelper.addToCart(userId, productId).then(() => {
    res.json({ status: true });
  });
};

// show the products in the cart of the speccific user
const getCartProducts = async (req, res) => {
  const userId = req.session.user._id;
  let cartCount = await cartHelper.getCartCount(userId);
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  let totalAmount = await cartHelper.getTotalAmount(userId);
  cartHelper
    .getCartProducts(userId)
    .then((cartItems) => {
      const emptyCart = cartItems.length;
      let user = req.session.user;
      res.render("user/cart", {
        user,
        cartItems,
        cartCount,
        totalAmount,
        emptyCart,
        wishlistCount,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
const changeProductQuantity = async (req, res) => {
  const userId = req.session.user._id;
  const cartId = req.body.cart;
  const productId = req.body.product;
  const count = req.body.count;
  const quantity = req.body.quantity;
  cartHelper
    .changeProductQuantity(cartId, productId, count, quantity)
    .then(async (response) => {
      response.total = await cartHelper.getTotalAmount(userId);
      res.json(response);
    });
};

const deleteProductFromCart = async (req, res) => {
  const proId = req.body.product;
  const cartId = req.body.cart;
  let userId = req.session.user._id;
  let cartCount = await cartHelper.getCartCount(userId);
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  cartHelper.deleteProductFromCart(proId, cartId).then(async (result) => {
    result.cartItemsCount = cartCount;
    result.total = await cartHelper.getTotalAmount(userId);
    res.json(result);
  });
};
const getTotalAmount = async (req, res) => {
  let userId = req.session.user._id;
  let user = req.session.user;
  let cartCount = await cartHelper.getCartCount(userId);
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  let totalAmount = await cartHelper.getTotalAmount(userId);
  let cartItems = await cartHelper.getCartProducts(userId);
  const userAddresses = await userHelper.getUserAddresses(userId);
  const cart = await cartHelper.userCart(userId);
  let afterCouponOffer = (totalAmount * cart.couponDiscountPercentage) / 100;

  if (!afterCouponOffer) {
    afterCouponOffer = 0;
  } else {
    afterCouponOffer = afterCouponOffer;
  }
  console.log(typeof afterCouponOffer);
  console.log(afterCouponOffer);
  res.render("user/checkout", {
    user,
    cartCount,
    totalAmount,
    cartItems,
    userAddresses,
    wishlistCount,
    afterCouponOffer,
  });
};

const placeOrder = async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  const userDetails = req.body;
  let cartCount = await cartHelper.getCartCount(userId);
  let products = await cartHelper.getCartProducts(userId);
  let total = await cartHelper.getTotalAmount(userId);
  cartHelper
    .placeOrder(userDetails, products, total, user, userId)
    .then((response) => {
      let orderId = response._id;
      if (req.body.paymentMethod == "COD") {
        res.json({ codSuccess: true });
        //
      } else if (req.body.paymentMethod == "razorpay") {
        cartHelper.generateRazorpay(userId, total).then((order) => {
          res.json(order);
        });
      } else if (req.body.paymentMethod == "paypal") {
        cartHelper.convertRate(total).then((data) => {
          // converting inr to usd
          convertedRate = Math.round(data);

          userHelper
            .generatePayPal(orderId.toString(), convertedRate)
            .then((response) => {
              response.insertedId = orderId;
              response.payPal = true;
              console.log(response);
              res.json(response);
            });
        });
      } else {
        console.log("something happened to error ");
      }
    });
};

const placed = async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  let cartCount = await cartHelper.getCartCount(userId);
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  let products = await cartHelper.getCartProducts(userId);
  let deleteCart = await cartHelper.deleteCartProducts(userId);
  res.render("user/order-placed", { user, products, cartCount, wishlistCount });
};

const verifypayment = (req, res) => {
  cartHelper.verifypayment(req.body).then(() => {
    res.json({ status: true });
  });
};

const userProfile = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user._id;
  cartCount = await cartHelper.getCartCount(userId);
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  res.render("user/profile", { user, cartCount, wishlistCount });
};

const myOrders = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user._id;
  const cartCount = await cartHelper.getCartCount(userId);
  const orderDetails = await userHelper.myOrders(userId);
  const wishlistCount = await cartHelper.getWishlistCount(userId);

  res.render("user/profile-orders", {
    orderDetails,
    user,
    cartCount,
    wishlistCount,
  });
};

const orderedProducts = async (req, res) => {
  const orderId = req.query.id;
  let user = req.session.user;
  const userId = req.session.user._id;
  const cartCount = await cartHelper.getCartCount(userId);
  const orders = await userHelper.orderedProducts(orderId);
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  res.render("user/profile-products", {
    user,
    orderId,
    cartCount,
    orders,
    wishlistCount,
  });
};
const cancelOrder = async (req, res) => {
  const userId = req.session.user._id;
  const proId = req.body.proId;
  const orderId = req.body.orderId;
  await userHelper.cancelOrder(proId, orderId, userId).then((response) => {
    res.json(response);
  });
};

const wishlist = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user._id;
  const cartCount = await cartHelper.getCartCount(userId);
  const userWishlist = await wishlistHelper.getWishlistProducts(userId);
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  console.log(userWishlist);
  res.render("user/wishlist", { user, cartCount, userWishlist, wishlistCount });
};

const addToWishlist = async (req, res) => {
  const proId = req.query.id;
  const userId = req.session.user._id;
  await wishlistHelper.addToWishlist(proId, userId).then((status) => {
    res.json(status);
  });
};
const removeProductFromWishlist = async (req, res) => {
  const proId = req.query.id;
  const userId = req.session.user._id;
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  await wishlistHelper.removeProductFromWishlist(proId).then((response) => {
    response.wishlistCount = wishlistCount;
    res.json(response);
  });
};

const userAddress = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user._id;
  const cartCount = await cartHelper.getCartCount(userId);
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  const userWishlist = await wishlistHelper.getWishlistProducts(userId);
  const userAddresses = await userHelper.getUserAddresses(userId);
  res.render("user/profile-address", {
    user,
    cartCount,
    userWishlist,
    userAddresses,
    userId,
    wishlistCount,
  });
};
const addAddress = (req, res) => {
  const userDetails = req.body;
  const userId = req.session.user._id;
  const addAddress = userHelper.userAddress(userDetails, userId);
  res.redirect("/my-address");
};
const deleteAddress = async (req, res) => {
  const userId = req.session.user._id;
  const addressId = req.body.addressId;

  await userHelper.deleteAddress(userId, addressId).then((response) => {
    res.json(response);
  });
};
const editAddress = async (req, res) => {
  const addressId = req.query.id;
  const userId = req.session.user._id;
  const user = req.body;
  await userHelper.editAddress(userId, addressId, user);
  res.json(response);
};

const editAccountDetails = async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  let cartCount = await cartHelper.getCartCount(userId);
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  let userDetails = await userHelper.getUserDetails(userId);
  res.render("user/account-details", {
    user,
    cartCount,
    userDetails,
    wishlistCount,
  });
};

const updateAccountDetails = async (req, res) => {
  let userId = req.session.user._id;
  const updatedUserDetails = req.body;
  const result = userHelper.updateAccountDetails(updatedUserDetails, userId);
  req.session.destroy((err) => {
    if (err) {
      res.send(err, "error");
    } else {
      res.redirect("/login");
    }
  });
};
const returnProduct = async (req, res) => {
  const proId = req.body.proId;
  const orderId = req.body.orderId;
  await userHelper.returnProduct(proId, orderId).then((statusChanged) => {
    res.json({ statusChanged });
  });
};

const applyCoupon = async (req, res) => {
  try {
    const user = req.session.user._id;
    const date = new Date();
    const totalAmount = req.body.totalAmount;
    const couponCode = req.body.coupon;
    if (couponCode == "") {
      res.json({ noCoupon: true, totalAmount });
    } else {
      let couponres = await cartHelper.applyCoupon(
        req.body,
        user,
        date,
        totalAmount
      );
      console.log(couponres);
      res.json(couponres);
    }
  } catch (error) {
    console.log(error);
  }
};
const undefined = (req, res) => {
  res.redirect("/");
};

const searchResults = async (req, res) => {
  let searchQuery = req.body.payload.trim();
  if (searchQuery.length > 0) {
    result = await userHelper.searchResults(searchQuery);
    res.send({ searchQuery: result, resultfound: true });
  } else {
    res.send({ searchQuery: "", resultfound: false });
  }
};

const razorpayFailed = async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  let cartCount = await cartHelper.getCartCount(userId);
  let wishlistCount = await cartHelper.getWishlistCount(userId);
  let userDetails = await userHelper.getUserDetails(userId);
  const orderId = req.query.id;
  await userHelper.deleteOrder(orderId).then(() => {
    res.render("user/cancel-payment", {
      user,
      cartCount,
      wishlistCount,
      userDetails,
    });
  });
};

const razorFailure = async (req, res) => {
  const orderId = req.query.id;
  await userHelper.deleteOrder(orderId).then(() => {
    res.redirect("/cancel-payment");
  });
};

const errorPage = (req, res) => {
  res.render("user/error");
};

module.exports = {
  userSignup,
  landingPage,
  loginPage,
  signupPage,
  userLogout,
  otpLogin,
  getOtplogin,
  getOtpverify,
  viewProduct,
  addToCart,
  getCartProducts,
  changeProductQuantity,
  deleteProductFromCart,
  getTotalAmount,
  placeOrder,
  userProfile,
  myOrders,
  orderedProducts,
  cancelOrder,
  wishlist,
  addToWishlist,
  removeProductFromWishlist,
  userAddress,
  addAddress,
  deleteAddress,
  editAddress,
  verifypayment,
  placed,
  editAccountDetails,
  updateAccountDetails,
  returnProduct,
  applyCoupon,
  viewCategoryProducts,
  undefined,
  searchResults,
  razorpayFailed,
  razorFailure,
  errorPage,
};
