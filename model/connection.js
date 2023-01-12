const mongoose = require("mongoose");
const { objectId } = require("mongoose");
require("dotenv").config();
// const db = mongoose.connect("mongodb://localhost:27017/Ecommerce");
const db = mongoose.connect(process.env.DATABASE);
const { ObjectId } = require("mongodb");
db.then(() => {
  console.log("connected");
}).catch((err) => {
  console.log("error");
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phonenumber: Number,
  password: String,
  isBlocked: Boolean,
  address: [
    {
      name: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
      email: String,
    },
  ],
});
const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  price: Number,
  offerPrice: Number,
  discountPercentage: Number,
  categoryDiscount: Number,
  offerPrice: Number,
  originalPrice: Number,
  categoryId: mongoose.Types.ObjectId,
  productOffer: Number,
});

const adminSchema = new mongoose.Schema({
  email: String,
  password: Number,
});

const categorySchema = new mongoose.Schema({
  categoryName: String,
  categoryDescription: String,
  offer: Number,
  ExpiryDate: String,
  offerApply: Boolean,
});

const cartSchema = new mongoose.Schema({
  user: mongoose.Types.ObjectId,
  cartProducts: [
    {
      item: mongoose.Types.ObjectId,
      quantity: Number,
    },
  ],
  couponApplied: String,
  couponIsActive: Boolean,
  couponIsUsed: Boolean,
  couponDiscount: Number,
  couponDiscountPercentage: Number,
});

const orderSchema = new mongoose.Schema({
  date: Date,
  orderDate: String,
  orderMonth: String,
  orderYear: String,
  user: mongoose.Types.ObjectId,
  paymentMethod: String,
  status: String,
  total: Number,
  deliveryDetails: [
    {
      name: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
      date: String,
      email: String,
    },
  ],

  products: [
    {
      item: mongoose.Types.ObjectId,
      quantity: Number,
      status: String,
    },
  ],
  couponApplied: String,
  couponDiscount: Number,
  couponDiscountPercentage: Number,
});

const wishlistSchema = new mongoose.Schema({
  user: mongoose.Types.ObjectId,
  products: [
    {
      item: mongoose.Types.ObjectId,
      inStock: Boolean,
    },
  ],
});

const couponSchema = new mongoose.Schema({
  couponCode: String,
  couponDiscount: Number,
  couponMaxDiscount: Number,
  couponMinCartValue: Number,
  date: String,
  expiryDate: String,
  status: String,
  userData: [
    // {
    //   userId: mongoose.Types.ObjectId,
    // },
  ],
});
const bannerSchema = new mongoose.Schema({
  name: String,
  description: String,
});

module.exports = {
  product: mongoose.model("Product", productSchema),
  user: mongoose.model("User", userSchema),
  admin: mongoose.model("admin", adminSchema),
  category: mongoose.model("category", categorySchema),
  cart: mongoose.model("cart", cartSchema),
  order: mongoose.model("order", orderSchema),
  wishlist: mongoose.model("wishlist", wishlistSchema),
  coupon: mongoose.model("coupon", couponSchema),
  banner: mongoose.model("banner", bannerSchema),
};
