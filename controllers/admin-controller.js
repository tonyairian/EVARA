const { render } = require("ejs");
const { response } = require("express");
const adminHelper = require("../helpers/admin-helper");
const productHelper = require("../helpers/product-helper");
const db = require("../model/connection");

//render admin home page and creates a session//
const adminLandingPage = async function (req, res) {
  req.session.admin=await db.admin.find();
  console.log( req.session.admin.name);
  let totalAmount = await adminHelper.totalAmount();
  let totalOrders = await adminHelper.totalOrders();
  let totalProducts = await adminHelper.totalProducts();
  let totalCategories = await adminHelper.totalCategories();
  const deliveredRevenue=await adminHelper.deliveredRevenue();
  if (req.session.admin) {
    res.render("admin/index", {
      totalAmount,
      totalOrders,
      totalProducts,
      totalCategories,
      deliveredRevenue
    });
  } else {
    res.redirect("/admin/login");
  }
};

//if admin have session the layout page is rendered else it is redirected to login//
const adminLogin = function (req, res, next) {
  if (req.session.admin) {
    res.header("cache-control", "private,no-cache,no-store,must revalidate");
    res.redirect("/admin");
  } else {
    res.render("admin/login", {
      loginErr: req.session.adminLoginErr,
    });
    req.session.adminLoginErr = false;
  }
};

//get all users send to getusers  and render it when its returned//
const getUsers = function (req, res, next) {
  adminHelper.getUsers().then((users) => {
    res.render("admin/users", { users });
  });
};

//get products send to getallproducts  adn render it when its returned//
const getAllProducts = function (req, res, next) {
  let docCount;
  const perPage = 5;
  const pageNum = req.query.page;
  console.log(pageNum);
  productHelper.getAllProducts(pageNum, docCount, perPage).then((products) => {
    res.render("admin/products", {
      products,
      currentPage: pageNum,
      totalDocuments: products.docCount,
      pages: Math.ceil(products.docCount / perPage),
    });
  });
};
//get products send to getcategories  adn render it when its returned//
const addNewProduct = (req, res) => {
  productHelper.getCategories().then((categories) => {
    res.render("admin/add-products", { categories });
  });
};

const addProduct = async (req, res) => {
  productHelper
    .addProduct(req.body)
    .then((insertedId) => {
      let name = insertedId._id;
      req.files?.productImage?.forEach((element, index) => {
        element.mv(
          "./public/product-images/" + name + index + ".png",
          (err, done) => {
            if (!err) {
              console.log("product add");
            } else {
              console.log(err);
            }
          }
        );
      });
      res.redirect("/admin/products");
    })
    .catch((err) => console.log(err));
};

//logs out admin//
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("logout failed");
    } else {
      res.redirect("/admin/login");
    }
  });
};

//code sent to blockUser in adminHelper//
const blockUser = (req, res) => {
  let userDetails = req.query;
  adminHelper.blockUser(userDetails).then((result) => {
    res.redirect("/admin/users");
  });
};

//code sent to UnblockUser in adminHelper//
const UnBlockUser = (req, res) => {
  let userDetails = req.query;
  adminHelper.UnBlockUser(userDetails).then((result) => {
    res.redirect("/admin/users");
  });
};

const viewOrders = async (req, res) => {
  const orderDetails = await adminHelper.viewOrders();
  res.render("admin/orders", { orderDetails });
};

const singleOrder = async (req, res) => {
  const orderId = req.query.id;
  const orderedItems = await adminHelper.singleOrder(orderId);
  console.log();
  const length = orderedItems.length;
  res.render("admin/single-order", { orderedItems });
};

const changeStatus = async (req, res) => {
  const proId = req.body.product;
  const orderId = req.body.order;
  const status = req.body.status;
  await adminHelper.changeStatus(proId, orderId, status).then((response) => {
    res.json({ statusChanged: status });
  });
};

const getCoupons = async (req, res) => {
  const coupons = await adminHelper.getCoupons();
  // console.log(coupons);
  res.render("admin/coupons", { coupons });
};

const addNewCoupon = (req, res) => {
  res.render("admin/add-new-coupon");
};
const addNewCouponPost = (req, res) => {
  adminHelper.createNewCoupon(req.body).then(() => {
    res.redirect("/admin/coupons");
  });
};

const editCoupon = async (req, res) => {
  const couponId = req.query.id;
  const couponData = await adminHelper.editCoupon(couponId);
  res.render("admin/edit-coupon", { couponData });
};
const postEditCoupon = async (req, res) => {
  const couponData = await adminHelper.postEditCoupon(req.body);
  console.log(couponData);
  res.redirect("/admin/coupons");
};

const deleteCoupon = async (req, res) => {
  const couponId = req.query.id;
  await adminHelper
    .deleteCoupon(couponId)
    .then(() => {
      res.redirect("/admin/coupons");
    })
    .catch((err) => {
      console.log(err);
    });
};

// -------------------------------------------------------------------
const dailyRevenue = async (req, res) => {
  try {
    await adminHelper.dailyRevenue().then((response) => {
      res.json(response);
    });
  } catch (error) {
    console.log(error);
  }
};

const paymentMethod = async (req, res) => {
  try {
    await adminHelper.paymentMethod().then((response) => {
      res.json(response);
    });
  } catch (error) {
    console.log(error);
  }
};

// -----------------------------
// ------------------------------
// -----------------------------
const salesReport = (req, res) => {
  res.render("admin/generate-report", {
    result: 0,
    startMon: 0,
    endMon: 0,
    startDate: 0,
    endDate: 0,
    date: 0,
  });
};

const monthlySalesReport = async (req, res) => {
  let month = req.body.month;
  let result = await adminHelper.getMonthlySalesReport(month);
  res.render("admin/generate-report", {
    result,
    month,
    monthly: false,
    date: false,
    year: false,
  });
};

const dailySalesReport = async (req, res) => {
  let startDate = req.body.start.slice(8, 10);
  let endDate = req.body.end.slice(8, 10);
  let startMon = req.body.start.slice(5, 7);
  let endMon = req.body.end.slice(5, 7);
  console.log(startMon, "and", endMon, "with", startDate, "and", endDate);
  let result = await adminHelper.getDailySalesReport(
    req.body.start,
    req.body.end
  );
  res.render("admin/generate-report", {
    result,
    startMon,
    endMon,
    startDate,
    endDate,
    date: true,
    monthly: true,
    mon: true,
    year: false,
  });
};

const yearlySalesReport = async (req, res) => {
  let year = req.body.year;
  console.log(year);
  let result = await adminHelper.getYearlySalesReport(year);
  res.render("admin/generate-report", {
    result,
    year,
    yearly: true,
    monthly: false,
    date: false,
  });
};

const banner = (req, res) => {
  try {
    adminHelper.banner().then((banner) => {
      res.render("admin/banner", {
        banner,
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const addBanner = (req, res) => {
  try {
    adminHelper.getCategories().then((category) => {
      res.render("admin/add-banner", { category });
    });
  } catch (error) {
    console.log(error);
  }
};
const addBannerPost = (req, res) => {
  try {
    adminHelper.addBannerPost(req.body).then((response) => {
      let image = req.files?.Image;
      let id = response?._id;
      image.mv("./public/add-banner/" + id + ".png", (err, done) => {
        if (!err) {
          res.redirect("/admin/banner");
        } else {
          console.log(err);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteBanner = (req, res) => {
  try {
    adminHelper.deleteBanner(req.query.id).then((response) => {
      res.redirect("/admin/banner");
    });
  } catch (error) {
    console.log(error);
  }
};

const getBanner = async (req, res) => {
  try {
    let category = await adminHelper.getCategories();
    adminHelper.getBanner(req.query.id).then((bannerDetails) => {
      res.render("admin/edit-banner", {
        bannerDetails,
        category,
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const editBanner = (req, res) => {
  try {
    let imageName = req.query.id;
    adminHelper.editBanner(req.query.id, req.body).then((response) => {
      req.files?.Image?.mv("./public/add-banner/" + imageName + ".png");
      res.redirect("/admin/banner");
    });
  } catch (error) {
    console.log(error);
  }
};

const viewOffer = async (req, res) => {
  try {
    let category = await adminHelper.getCategories();
    res.render("admin/offer", { category });
  } catch (error) {
    res.render("admin/error");
  }
};

const addCategoryOffer = (req, res) => {
  console.log(req.body);
  try {
    adminHelper.addCategoryOffer(req.body).then((category) => {
      adminHelper.getProductForOffer(category).then((products) => {
        products.forEach((element) => {
          adminHelper.addOfferToProduct(req.body, element);
        });
        res.redirect("/admin/offer");
      });
    });
  } catch (error) {
    // res.render("admin/error",{layout: "admin-layout"})
    console.log(err);
  }
};
const removeCategoryOffer = (req, res) => {
  try {
    let id = req.query.id;
    adminHelper.removeCategoryOffer(id);
    res.redirect("/admin/offer");
  } catch (error) {
    // res.render("admin/error",{layout: "admin-layout"})
    console.log(error);
  }
};
module.exports = {
  adminLandingPage,
  adminLogin,
  getUsers,
  getAllProducts,
  addNewProduct,
  logout,
  blockUser,
  UnBlockUser,
  viewOrders,
  singleOrder,
  changeStatus,
  addProduct,
  getCoupons,
  addNewCoupon,
  addNewCouponPost,
  editCoupon,
  postEditCoupon,
  deleteCoupon,
  dailyRevenue,
  paymentMethod,
  monthlySalesReport,
  dailySalesReport,
  yearlySalesReport,
  salesReport,
  addBanner,
  banner,
  addBannerPost,
  deleteBanner,
  getBanner,
  editBanner,
  viewOffer,
  addCategoryOffer,
  removeCategoryOffer,
};
