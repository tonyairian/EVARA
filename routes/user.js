var express = require("express");
var router = express.Router();
const userController = require("../controllers/user-controller");
const userHelper = require("../helpers/user-helper");
const { verifyLogin, verifyLoginAjax } = require("../middlewares/verify-login");
router.get("/undefined", userController.undefined);
router.get("/", userController.landingPage);
router.get("/login", userController.loginPage);
router.get("/signup", userController.signupPage);
router.post("/signup", userController.userSignup);
router.post("/login", userHelper.userLogin);
router.get("/logout", userController.userLogout);
router.get("/otp-login", userController.otpLogin);
router.get("/otp_login", userController.getOtplogin);
router.get("/otp_verify", userController.getOtpverify);
router.get("/product", userController.viewProduct);
router.get("/add-to-cart", verifyLoginAjax, userController.addToCart);
router.get("/add-to-wishlist", verifyLoginAjax, userController.addToWishlist);
router.get("/category-product", userController.viewCategoryProducts);
router.get("/error", userController.errorPage);
router.post("/search", userController.searchResults);
// router.use(verifyLogin);
router.get("/cart", userController.getCartProducts);
router.post("/change-product-quantity", userController.changeProductQuantity);
router.post("/delete-product", userController.deleteProductFromCart);
router.get("/checkout", userController.getTotalAmount);
router.post("/place-order", userController.placeOrder);
router.get("/profile", userController.userProfile);
router.get("/my-orders", userController.myOrders);
router.get("/view-product-profile", userController.orderedProducts);
router.post("/cancel-order", userController.cancelOrder);
router.get("/profile-product-view", userController.viewProduct);
router.get("/wishlist", userController.wishlist);
router.post("/remove-p-wishlist", userController.removeProductFromWishlist);
router.get("/my-address", verifyLogin, userController.userAddress);
router.post("/add-address", verifyLogin, userController.addAddress);
router.post("/delete-address", verifyLogin, userController.deleteAddress);
router.post("/edit-address", verifyLogin, userController.editAddress);
router.post("/verify-payment", verifyLogin, userController.verifypayment);
router.get("/placed", userController.placed);
router.get("/edit-account-details", userController.editAccountDetails);
router.post("/edit-account-details", userController.updateAccountDetails);
router.post("/return-product", userController.returnProduct);
router.post("/apply-coupon", userController.applyCoupon);
router.get("/cancel-payment", userController.razorpayFailed);
router.get("/payment-failed", userController.razorFailure);

module.exports = router;
