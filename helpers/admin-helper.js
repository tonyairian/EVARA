const db = require("../model/connection");
const objectId = require("objectid");
const { AwsPage } = require("twilio/lib/rest/accounts/v1/credential/aws");
const adminLogin = (req, res) => {
  return new Promise(async (resolve, reject) => {
    let adminData = req.body;
    await db.admin
      .findOne({ email: adminData.email })

      .then((result) => {
        if (
          adminData.email == result.email &&
          adminData.password == result.password
        ) {
          req.session.loggedIn = true;
          req.session.admin = adminData;
          res.redirect("/admin");
        } else {
          req.session.adminLoginErr = " Invalid Username or Password";
          res.redirect("/admin/login");
        }
      })
      .catch((err) => {
        req.session.adminLoginErr = " Invalid Username or Password";
        res.redirect("/admin/login");
      });
  });
};

//get users from db return it to userManagement and render it on the page//
const getUsers = (req, res) => {
  return new Promise(async (resolve, reject) => {
    let users = await db.user.find();
    resolve(users);
  });
};

//block user by updating the isBlocked variable in the db true and return it to blockUser //
const blockUser = (userDetails, req, res) => {
  return new Promise(async (resolve, reject) => {
    let id = userDetails.id;
    let user = await db.user
      .updateOne(
        { _id: id },
        {
          $set: {
            isBlocked: true,
          },
        }
      )
      .then((result) => {
        resolve(result);
      });
  });
};

//block user by updating the isBlocked variable in the db false and return it to unblockUser //
const UnBlockUser = (userDetails, req, res) => {
  return new Promise(async (resolve, reject) => {
    let id = userDetails.id;
    let user = await db.user
      .updateOne(
        { _id: id },
        {
          $set: {
            isBlocked: false,
          },
        }
      )
      .then((result) => {
        resolve(result);
      });
  });
};

// products-----------------------------------

const viewOrders = (req, res) => {
  return new Promise(async (resolve, reject) => {
    const orderDetails = await db.order.find({});

    resolve(orderDetails);
  });
};

const singleOrder = (orderId) => {
  return new Promise(async (resolve, reject) => {
    const orderedItems = await db.order.aggregate([
      {
        $match: { _id: objectId(orderId) },
      },
      {
        $unwind: "$products",
      },
      {
        $unwind: "$deliveryDetails",
      },
      {
        $project: {
          paymentMethod: "$paymentMethod",
          orderId: "$_id",
          total: "$total",
          item: "$products.item",
          quantity: "$products.quantity",
          productStatus: "$products.status",
          status: "$status",
          name: "$deliveryDetails.name",
          phone: "$deliveryDetails.phone",
          address: "$deliveryDetails.address",
          pincode: "$deliveryDetails.pincode",
          state: "$deliveryDetails.state",
          email: "$deliveryDetails.email",
          date: "$deliveryDetails.date",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "item",
          foreignField: "_id",
          as: "orderedItems",
        },
      },
      {
        $project: {
          paymentMethod: 1,
          orderId: 1,
          status: 1,
          _id: 0,
          item: 1,
          quantity: 1,
          productStatus: 1,
          name: 1,
          phone: 1,
          address: 1,
          pincode: 1,
          state: 1,
          total: 1,
          email: 1,
          date: 1,
          product: { $arrayElemAt: ["$orderedItems", 0] },
        },
      },
    ]);

    resolve(orderedItems);
  });
};
const changeStatus = (proId, orderId, status) => {
  return new Promise(async (resolve, reject) => {
    const statusChanged = await db.order.updateOne(
      { _id: orderId, "products.item": proId },
      { $set: { "products.$.status": status } }
    );
    resolve(statusChanged);
  });
};

const totalAmount = () => {
  return new Promise(async (resolve, reject) => {
    await db.order
      .aggregate([
        { $group: { _id: null, sum: { $sum: "$total" } } },
        { $project: { _id: 0 } },
      ])
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const totalOrders = () => {
  return db.order.count();
};
const totalProducts = () => {
  return db.product.count();
};
const totalCategories = () => {
  return db.category.count();
};

const createNewCoupon = async (couponData) => {
  couponData.date = new Date().toDateString();
  couponData.status = "ACTIVE";
  try {
    return await new Promise(async (resolve, reject) => {
      await db
        .coupon(couponData)
        .save()
        .then((response) => {
          if (response) {
            resolve(response);
          } else {
            reject();
          }
        });
    });
  } catch (err) {
    console.log(err);
  }
};
const getCoupons = async () => await db.coupon.find().sort({ expiryDate: -1 });
const editCoupon = async (couponId) =>
  await db.coupon.findOne({ _id: couponId });

const postEditCoupon = async (couponDetails) => {
  const couponId = couponDetails.id;
  return await db.coupon.updateOne(
    { _id: couponId },
    {
      $set: {
        couponCode: couponDetails.couponCode,
        couponDiscount: couponDetails.couponDiscount,
        expiryDate: couponDetails.expiryDate,
        couponMaxDiscount: couponDetails.couponMaxDiscount,
        couponMinCartValue: couponDetails.couponMinCartValue,
      },
    }
  );
};
const deleteCoupon = async (couponId) => {
  await db.coupon.deleteOne({ _id: couponId });
};

// ----------------------------------------------------------

const dailyRevenue = () => {
  return new Promise(async (resolve, reject) => {
    const date = new Date();

    await db.order
      .aggregate([
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $match: { "products.status": "Delivered" },
        },
        {
          $lookup: {
            from: "products",
            localField: "products.item",
            foreignField: "_id",
            as: "output",
          },
        },
        {
          $unwind: {
            path: "$output",
          },
        },

        {
          $group: {
            _id: { $dateToString: { format: "%d", date: date } },
            totalAmount: { $sum: "$output.price" },
          },
        },
        {
          $project: {
            _id: 1,
            totalAmount: 1,
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ])
      .then((response) => {
        console.log(response);
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const paymentMethod = () => {
  return new Promise(async (resolve, reject) => {
    await db.order
      .aggregate([
        {
          $project: {
            paymentMethod: 1,
            _id: 0,
          },
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: {
              $sum: 1,
            },
          },
        },
      ])
      .then((response) => {
        resolve(response);
      });
  });
};

// -----------------------
// ------------------------
// -----------------------
const getMonthlySalesReport = (month) => {
  return new Promise(async (resolve, reject) => {
    let monthlyReport = await db.order.aggregate([
      {
        $match: {
          orderMonth: month,
        },
      },
      {
        $unwind: {
          path: "$products",
        },
      },
      {
        $match: { "products.status": "Delivered" },
      },
      {
        $lookup: {
          from: "products",
          localField: "products.item",
          foreignField: "_id",
          as: "output",
        },
      },
      {
        $unwind: {
          path: "$output",
        },
      },
      {
        $group: {
          _id: "$output.category",
          totalAmount: {
            $sum: "$total",
          },
        },
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
        },
      },
    ]);
    resolve(monthlyReport);
  });
};

const getYearlySalesReport = (year) => {
  return new Promise(async (resolve, reject) => {
    let YearlyReport = await db.order.aggregate([
      {
        $match: { orderYear: year },
      },
      {
        $unwind: {
          path: "$products",
        },
      },
      {
        $match: { "products.status": "Delivered" },
      },
      {
        $lookup: {
          from: "products",
          localField: "products.item",
          foreignField: "_id",
          as: "output",
        },
      },
      {
        $unwind: {
          path: "$output",
        },
      },
      {
        $group: {
          _id: "$output.category",
          totalAmount: {
            $sum: "$total",
          },
        },
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
        },
      },
    ]);
    resolve(YearlyReport);
  });
};

const getDailySalesReport = (start, end) => {
  return new Promise(async (resolve, reject) => {
    console.log(start, end);
    let dailyReport = await db.order
      .aggregate([
        {
          $match: { orderDate: { $gte: start, $lte: end } },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $match: { "products.status": "Delivered" },
        },
        {
          $lookup: {
            from: "products",
            localField: "products.item",
            foreignField: "_id",
            as: "output",
          },
        },
        {
          $unwind: {
            path: "$output",
          },
        },
        {
          $group: {
            _id: "$output.category",
            totalAmount: {
              $sum: "$total",
            },
          },
        },
        {
          $project: {
            _id: 1,
            totalAmount: 1,
          },
        },
      ])
      .then((response) => {
        resolve(response);
      });
  });
};

// banner
const getCategories = () => {
  return new Promise(async (resolve, reject) => {
    await db.category
      .find()
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const banner = () => {
  return new Promise(async (resolve, reject) => {
    await db.banner
      .find()
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const addBannerPost = (bannerDetails) => {
  return new Promise(async (resolve, reject) => {
    // await db.banner.find({}).then((response) => {
    //   if (response) {
    //     db.banner.deleteOne();
    //   }
    // });

    db.banner(bannerDetails)
      .save()
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const deleteBanner = (banId) => {
  return new Promise((resolve, reject) => {
    db.banner
      .deleteOne({ _id: banId })
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
const getBanner = (banId) => {
  return new Promise(async (resolve, reject) => {
    await db.banner
      .findOne({ _id: objectId(banId) })
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

let editBanner = (banId, bannerDetails) => {
  return new Promise(async (resolve, reject) => {
    db.banner
      .updateOne(
        { _id: banId },
        {
          $set: {
            name: bannerDetails.name,
            description: bannerDetails.description,
          },
        }
      )
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const addCategoryOffer = ({ category, offerPercentage, expDate }) => {
  let categoryOffer = parseInt(offerPercentage);
  offer = categoryOffer;

  return new Promise((resolve, reject) => {
    db.category
      .updateOne(
        { categoryName: category },
        {
          $set: {
            offer: offer,
            ExpiryDate: expDate,
            offerApply: true,
          },
        },
        { upsert: true }
      )
      .then(() => {
        resolve(category);
      });
  });
};
const getProductForOffer = (category) => {
  return new Promise(async (resolve, reject) => {
    await db.product.find({ category: category }).then((products) => {
      resolve(products);
    });
  });
};

const addOfferToProduct = ({ category, offerPercentage }, product) => {
  let offerP = parseInt(offerPercentage);
  offerPercentage = offerP;
  let productPrice = parseInt(product.Oprice);
  product.price = productPrice;
  let offerPrice = (offerPercentage / 100) * product.price;
  let totalPrice = product.price - offerPrice;
  totalPrice = Math.round(totalPrice);
  return new Promise((resolve, reject) => {
    db.product
      .updateOne(
        { _id: product._id, category: category },
        {
          $set: {
            discountPercentage: offerPercentage,
            categoryDiscount: offerPrice,
            price: totalPrice,
            originalPrice: product.price,
          },
        }
      )
      .then(() => {
        resolve();
      });
  });
};


const removeCategoryOffer = (catId) => {
  return new Promise(async (resolve, reject) => {
    let catDet = await db.category.findOne({ _id: objectId(catId) });
    let category = catDet.name;
    db.category
      .updateOne(
        { _id:catId },
        {
          $unset: {
            ExpiryDate: "",
            offerApply: "",
            offer: "",
          },
        }
      )
      .then((response) => {
        db.product
          .updateMany(
            { category: category },
            {
              $unset: {
                categoryDiscount: "",
                discountPercentage: "",
                offerPrice: "",
              },
            }
          )
          .then((respo) => {
            resolve(respo);
          });
      });
  });
};
module.exports = {
  adminLogin,
  getUsers,
  blockUser,
  UnBlockUser,
  viewOrders,
  singleOrder,
  changeStatus,
  totalAmount,
  totalOrders,
  totalProducts,
  totalCategories,
  createNewCoupon,
  getCoupons,
  editCoupon,
  postEditCoupon,
  deleteCoupon,
  dailyRevenue,
  paymentMethod,
  getMonthlySalesReport,
  getYearlySalesReport,
  getDailySalesReport,
  getCategories,
  addBannerPost,
  banner,
  deleteBanner,
  getBanner,
  editBanner,
  addCategoryOffer,
  getProductForOffer,
  addOfferToProduct,
  removeCategoryOffer
};
