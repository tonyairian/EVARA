const db = require("../model/connection");
const bcrypt = require("bcrypt");
const objectId = require("objectid");
const addToWishlist = (proId, userId) => {
  return new Promise(async (resolve, reject) => {
    let productObj = {
      item: proId,
      inStock: true,
    };
    const userWishlist = await db.wishlist.findOne({ user: userId });
    if (userWishlist) {
      let productExists = userWishlist.products.findIndex(
        (product) => product.item == proId
      );

      if (productExists >= 0) {
        resolve({status:"exists"})
        
      } else {
        db.wishlist
          .updateOne({ user: userId }, { $push: { products: productObj } })
          .then((result) => {
            // resolve(result);
            resolve({status:"added"})
          });
      }
    } else {
      let wishlistObj = {
        user: userId,
        products: [productObj],
      };
      db.wishlist(wishlistObj)
        .save()
        .then((response) => {
          if (response) {
            resolve(response);
          } else {
            reject();
          }
        });
    }
  });
};
const getWishlistProducts = (userId) => {
  return new Promise(async (resolve, reject) => {
    await db.wishlist
      .aggregate([
        { $match: { user: userId } },
        { $unwind: "$products" },
        { $project: { item: "$products.item", inStock: "$products.inStock" } },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "wishlistItems",
          },
        },
        {
          $unwind: "$wishlistItems",
        },
        {
          $project: {
            name: "$wishlistItems.name",
            price: "$wishlistItems.price",
            inStock: 1,
            item: 1,
          },
        },
      ])
      .then((products) => {
        resolve(products);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const removeProductFromWishlist = (proId) => {
  return new Promise(async (resolve, reject) => {
    await db.wishlist
      .updateOne(
        { item: proId },
        {
          $pull: {
            products: { item: proId },
          },
        }
      )
      .then((result) => {
        resolve({ productRemoved: true });
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports = {
  addToWishlist,
  getWishlistProducts,
  removeProductFromWishlist,
};
