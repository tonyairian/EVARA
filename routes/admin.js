var express = require("express");
var router = express.Router();
const adminController = require("../controllers/admin-controller");
const adminHelper = require("../helpers/admin-helper");
const productHelper = require("../helpers/product-helper");
const verifyLogin = require("../middlewares/verify-login-admin");
router.get("/", adminController.adminLandingPage);
router.get("/login", adminController.adminLogin);
router.post("/login", adminHelper.adminLogin);
router.use(verifyLogin);
router.get("/users", adminController.getUsers);
router.get("/products", adminController.getAllProducts);
router.get("/add-product", adminController.addNewProduct);
router.post("/add-product", adminController.addProduct);
router.get("/logout", adminController.logout);
router.get("/delete-product", productHelper.deleteProduct);
router.get("/edit-product", productHelper.editProduct);
router.post("/edit-product/:id", productHelper.updateProduct);
router.get("/block-user", adminController.blockUser);
router.get("/unBlock-user", adminController.UnBlockUser);
router.get("/categories", productHelper.categories);
router.post("/categories", productHelper.addCategories);
router.get("/edit-category", productHelper.editCategory);
router.get("/delete-category", productHelper.deleteCategory);
router.post("/edit-category", productHelper.updateCategory);
router.get("/orders", adminController.viewOrders);
router.get("/single-order", adminController.singleOrder);
router.post("/change-status", adminController.changeStatus);
router.get("/coupons", adminController.getCoupons);
router.get("/new-coupon", adminController.addNewCoupon);
router.post("/new-coupon", adminController.addNewCouponPost);
router.get("/edit-coupon", adminController.editCoupon);
router.post("/edit-coupon", adminController.postEditCoupon);
router.get("/delete-coupon", adminController.deleteCoupon);
router.get("/test", adminController.dailyRevenue);
router.get("/test3", adminController.paymentMethod);
router.get("/get-Report", adminController.salesReport);
router.post("/sales-rep-mon", adminController.monthlySalesReport);
router.post("/sales-rep-daily", adminController.dailySalesReport);
router.post("/sales-rep-yearly", adminController.yearlySalesReport);
router.get("/banner", adminController.banner);
router.get("/add-banner", adminController.addBanner);
router.post("/add-banner", adminController.addBannerPost);
router.get("/delete-banner", adminController.deleteBanner);
router.get("/get-banner", adminController.getBanner);
router.post("/edit-banner", adminController.editBanner);
router.get("/offer", adminController.viewOffer);
router.post("/admin-addCategoryOffer", adminController.addCategoryOffer);
router.get("/delete-offer", adminController.removeCategoryOffer);
// router.get("/delete-offer", (req,res)=>{
//   console.log(req.query.id);
// });

module.exports = router;