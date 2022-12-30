const db = require("../model/connection");
const bcrypt = require("bcrypt");
const objectId = require("objectid");
const paypal = require("paypal-rest-sdk");
const { product } = require("../model/connection");
require("dotenv").config();

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

const userSignup = (userDetails) => {
  return new Promise((resolve, reject) => {
    userDetails.isBlocked = false;
    let userPassword = userDetails.password;
    bcrypt.hash(userPassword, 10).then(async (result) => {
      userDetails.password = result;
      await db.user(userDetails).save();
      resolve((response = true));
    });
  });
};

const userLogin = (req, res) => {
  return new Promise(async (resolve, reject) => {
    const userDetails = req.body;
    let userDetailsFromDatabase = await db.user.findOne({
      email: userDetails.email,
    });
    if (userDetailsFromDatabase.isBlocked) {
      req.session.isBlocked = "you are blocked";
      res.redirect("/login");
    } else {
      if (userDetailsFromDatabase) {
        bcrypt
          .compare(userDetails.password, userDetailsFromDatabase.password)
          .then((result) => {
            if (result) {
              req.session.loggedIn = true;
              req.session.user = userDetailsFromDatabase;
              // res.redirect("/");
              res.redirect(req.session.returnTo);
            } else {
              req.session.loginErr = "invalid username or password";

              res.redirect("/login");
            }
          });
      } else {
        console.log("No user found");
      }
    }
  });
};

const getCatCount = (req, res) => {
  return new Promise(async (resolve, reject) => {
    const catCount = await db.category.find({});
    resolve(catCount);
  });
};

const getCategory = (catName) => {
  return new Promise(async (resolve, reject) => {
    await db.product.findOne({ category: catName }).then((response) => {
      resolve(response);
    });
  });
};

const viewCategoryProducts = (catId) => {
  return new Promise(async (resolve, reject) => {
    const products = await db.product.find({ _id: catId });
    const catName = products[0].category;
    const allProducts = await db.product.find({ category: catName });
    resolve(allProducts);
  });
};

const getProducts = (req, res) => {
  return new Promise(async (resolve, reject) => {
    await db.product.find({}).then((product) => {
      resolve(product);
    });
  });
};

const viewProduct = (id, req, res) => {
  return new Promise(async (resolve, reject) => {
    const product = await db.product
      .findOne({ _id: objectId(id) })
      .then((product) => {
        resolve(product);
      });
  });
};

const myOrders = (userId) => {
  return new Promise(async (resolve, reject) => {
    const orderDetails = await db.order.find({ user: userId });
    resolve(orderDetails);
  });
};

const orderedProducts = (orderId) => {
  return new Promise(async (resolve, reject) => {
    const products = await db.order.aggregate([
      {
        $match: { _id: objectId(orderId) },
      },
      {
        $unwind: "$deliveryDetails",
      },
      {
        $unwind: "$products",
      },
      {
        $project: {
          name: "$deliveryDetails.name",
          phone: "$deliveryDetails.phone",
          address: "$deliveryDetails.address",
          pincode: "$deliveryDetails.pincode",
          state: "$deliveryDetails.state",
          product: "$products.item",
          quantity: "$products.quantity",
          status: "$products.status",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "cartProducts",
        },
      },
      {
        $unwind: "$cartProducts",
      },
    ]);
    resolve(products);
  });
};

const cancelOrder = (proId, orderId, userId) => {
  return new Promise(async (resolve, reject) => {
    await db.order
      .updateOne(
        { _id: orderId.trim(), "products.item": proId.trim() },
        { $set: { "products.$.status": "cancelled" } }
      )

      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const userAddress = (userDetails, userId) => {
  return new Promise(async (resolve, reject) => {
    const address = userDetails.address.toString();
    let Details = {
      name: userDetails.name,
      address: address,
      city: userDetails.city,
      state: userDetails.state,
      pincode: userDetails.pincode,
      phone: userDetails.phone,
      email: userDetails.email,
    };
    const addAddress = await db.user.findOneAndUpdate(
      { _id: userId },
      { $push: { address: Details } }
    );
    resolve(addAddress);
  });
};

const getUserAddresses = (userId) => {
  return new Promise(async (resolve, reject) => {
    await db.user
      .aggregate([
        { $match: { _id: userId } },
        { $unwind: "$address" },
        {
          $project: {
            name: "$address.name",
            phone: "$address.phone",
            address: "$address.address",
            city: "$address.city",
            pincode: "$address.pincode",
            state: "$address.state",
            addressId: "$address._id",
            email: "$address.email",
          },
        },
      ])
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
const deleteAddress = (userId, addressId) => {
  return new Promise(async (resolve, reject) => {
    await db.user
      .updateOne({ _id: userId }, { $pull: { address: { _id: addressId } } })
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
const editAddress = (userId, addressId, user) => {
  return new Promise(async (resolve, reject) => {
    await db.user
      .updateOne(
        { _id: userId, "address._id": addressId },
        {
          $set: {
            "address.$.name": user.name,
            "address.$.address": user.address,
            "address.$.city": user.city,
            "address.$.state": user.state,
            "address.$.pincode": user.pincode,
            "address.$.phone": user.phone,
            "address.$.email": user.email,
          },
        }
      )
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const getUserDetails = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userDetails = await db.user.findOne({ _id: userId });
      resolve(userDetails);
    } catch (err) {
      reject(err);
    }
  });
};
const updateAccountDetails = async (updatedUserDetails, userId) => {
  return new Promise(async (resolve, reject) => {
    let result = await bcrypt
      .hash(updatedUserDetails.password, 10)
      .then(async (result) => {
        updatedUserDetails.password = result;
        await db.user.updateOne(
          { _id: userId },
          {
            $set: {
              name: updatedUserDetails.name,
              email: updatedUserDetails.email,
              phonenumber: updatedUserDetails.phonenumber,
              password: updatedUserDetails.password,
            },
          }
        );
      });
  })
    .then((result) => {
      resolve(result);
    })
    .catch((err) => {
      reject(err);
    });
};

const generatePayPal = (orderId, totalPrice) => {
  return new Promise((resolve, reject) => {
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:3000/placed",
        cancel_url: "http://localhost:3000/cancel",
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: "Red Sox Hat",
                sku: "001",
                price: totalPrice,
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: totalPrice,
          },
          description: "Hat for the best team ever",
        },
      ],
    };
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {
        resolve(payment);
      }
    });
  });
};

const returnProduct = (proId, orderId) => {
  const status = "product returned";
  return new Promise(async (resolve, reject) => {
    const statusChanged = await db.order.updateOne(
      { _id: orderId.trim(), "products.item": proId.trim() },
      { $set: { "products.$.status": status } }
    );
    resolve(statusChanged);
  });
};
const getBanner = () => {
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

const searchResults = async (searchQuery) => {
  try {
    const result = await db.product
      .find({ name: new RegExp("^" + searchQuery + ".*", "i") })
      .limit(5);
    return result;
  } catch (error) {
    console.log(error);
  }
};

const deleteOrder = async (orderId) => {
  try {
    return await db.order.deleteOne({ _id: orderId });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  userSignup,
  userLogin,
  getProducts,
  orderedProducts,
  viewProduct,
  myOrders,
  userAddress,
  getUserAddresses,
  deleteAddress,
  editAddress,
  cancelOrder,
  getUserDetails,
  updateAccountDetails,
  generatePayPal,
  returnProduct,
  getCatCount,
  getCategory,
  viewCategoryProducts,
  getBanner,
  searchResults,
  deleteOrder,
};
