const db = require("../model/connection");
const objectId = require("objectid");

//get all the categories from db//
const getCategories = (req, res) => {
  return new Promise(async (resolve, reject) => {
    await db.category.find().then((categories) => {
      console.log(categories);
      resolve(categories);
    });
  });
};

//Adds a new product to the db//
// const addProduct = (product,image) => {
//   return new Promise((resolve, reject) => {
//     db.product(product)
//       .save()
//       .then((result) => {
//         resolve(result);
//       });
//   });
// };
const addProduct = async (productData) => {
  productData.price = parseInt(productData.price);
  const result = await db.category.aggregate([
    {
      $match: { categoryName: productData.category },
    },
  ]);
  productData.categoryId = result[0]._id;
  return new Promise(async (resolve, reject) => {
    db.product(productData)
      .save()
      .then((data) => {
        resolve(data);
      });
  });
};
//gets all the products from  db and returns to getAllproducts//
const getAllProducts = (pageNum, docCount, perPage) => {
  // return new Promise(async (resolve, reject) => {
  //   let product = await db.product.find();
  //   resolve(product);
  // });
  return new Promise(async (resolve, reject) => {
    await db.product
      .find()
      .sort({ $natural: -1 })
      .countDocuments()
      .then((documents) => {
        docCount = documents;
        return db.product
          .find()
          .sort({ $natural: -1 })
          .skip((pageNum - 1) * perPage)
          .limit(perPage);
      })

      .then((productDetails) => {
        productDetails.docCount = docCount;
        resolve(productDetails);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

//deletes a product //
const deleteProduct = (req, res) => {
  let productId = req.query.id;
  return new Promise(async (resolve, reject) => {
    await db.product.deleteOne({ _id: productId }).then((result) => {
      res.redirect("/admin/products");
    });
  });
};

//edit product .. the id was sent through url as query and is was passed to the getProduct details method and render the edit from//
const editProduct = async (req, res) => {
  let productId = req.query.id;
  let product = await getProductDetails(productId);
  res.render("admin/edit-product", { layout: "admin-layout", product });
};

//find the product using the id from the db//
const getProductDetails = (productId) => {
  return new Promise((resolve, reject) => {
    db.product.findOne({ _id: objectId(productId) }).then((product) => {
      resolve(product);
    });
  });
};

//here it actually edit and updates  the product on the db and redirect to the products page//
const updateProduct = (req, res) => {
  return new Promise((resolve, reject) => {
    let productId = req.params.id;
    let productDetails = req.body;
    console.log(req.body);
    console.log(productId);
    db.product
      .updateOne(
        // { _id: objectId('productId') },//false
        { _id: productId },
        {
          $set: {
            name: productDetails.name,
            description: productDetails.description,
            price: productDetails.price,
          },
        }
      )
      .then((result) => {
        res.redirect("/admin/products");
      });
  });
};

//render the category page admin//
const categories = (req, res) => {
  return new Promise((resolve, reject) => {
    db.category
      .find({})
      .then((categories) => {
        res.render("admin/categories", { categories });
      })
      .catch((err) => {
        res.render("user/error");
      });
  });
};

//adds a new category to the list//
const addCategories = (req, res) => {
  let data = req.body;
  return new Promise(async (resolve, reject) => {
    let category = await db
      .category(data)
      .save()
      .then((result) => {
        res.redirect("/admin/categories");
      })
      .catch((err) => {
        console.log("category is not added", err);
      });
  });
};

//delete a category//
const deleteCategory = (req, res) => {
  const ID = req.query.id;
  return new Promise(async (resolve, reject) => {
    await db.category
      .deleteOne({ _id: ID })
      .then((result) => {
        res.redirect("/admin/categories");
      })
      .catch((err) => {
        console.log("category delete error");
      });
  });
};

//edit category .. the id was sent through url as query and is was passed to the getcategorydetails  method and render the edit page when the value is returned//
const editCategory = async (req, res) => {
  const categoryId = req.query.id;
  let category = await getCategoryDetails(categoryId);
  res.render("admin/edit-categories", { category });
};

//gets the category from the db//
const getCategoryDetails = (categoryId) => {
  return new Promise((resolve, reject) => {
    db.category.findOne({ _id: objectId(categoryId) }).then((category) => {
      resolve(category);
    });
  });
};

//here it actually edit and updates  the category on the db and redirect to the category page//

const updateCategory = (req, res) => {
  const categoryDetails = req.body;
  const categoryId = req.query.id;
  return new Promise(async (resolve, reject) => {
    await db.category
      .updateOne(
        { _id: categoryId },
        {
          $set: {
            categoryName: categoryDetails.categoryName,
            categoryDescription: categoryDetails.categoryDescription,
          },
        }
      )
      .then(async (data) => {
        await db.product
          .updateOne(
            { categoryId: categoryId },
            {
              $set: {
                category: categoryDetails.categoryName,
              },
            }
          )
          .then(() => {
            res.redirect("/admin/categories");
          });
      })
      .catch((err) => {
        console.log("category update failed");
      });
  });
};

module.exports = {
  getAllProducts,
  addProduct,
  deleteProduct,
  editProduct,
  updateProduct,
  addCategories,
  categories,
  deleteCategory,
  editCategory,
  updateCategory,
  getCategories,
};
