const express = require("express");
const router = express.Router();

const { catchAsync } = require("../utils/error");
const AppError = require("../utils/appError");
const ProductModel = require("../models/productModel");
const UserModel = require("../models/usersModel");
const auth = require("../middleware/auth");

// To get all the products & cart items for show product page
router.get(
  "/products/:userId",
  catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    let userCart;
    const products = await ProductModel.find();
    if (userId && userId !== "undefined") {
      const user = await UserModel.findById(userId);
      userCart = user?.cart;
    } else {
      userCart = [];
    }

    res.status(200).json({
      status: "success",
      data: {
        products,
        cart: userCart,
      },
    });
  })
);

// Add items to cart from product page
router.post(
  "/add-cart",
  auth,
  catchAsync(async (req, res, next) => {
    const cartData = req.body;
    const updateCart = await UserModel.updateOne(
      { _id: req?.user?.id },
      {
        $set: {
          cart: cartData,
        },
      }
    );
    res.status(200).json({
      status: "success",
      message: "Data added successfully",
    });
  })
);

// To get cart details including product deatails to show in cart page
router.get(
  "/cart",
  auth,
  catchAsync(async (req, res, next) => {
    const userWithCart = await UserModel.aggregate([
      {
        $match: { _id: req?.user?._id },
      },
      {
        $unwind: "$cart",
      },
      {
        $addFields: {
          "cart.productId": { $toObjectId: "$cart.productId" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "cart.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $project: {
          name: 1,
          "cart.productId": 1,
          "cart.quantity": 1,
          "productDetails.name": 1,
          "productDetails.price": 1,
          "productDetails.description": 1,
          "productDetails.image": 1,
          "productDetails.stock": 1,
        },
      },

      {
        $group: {
          _id: "$_id",
          cartItems: {
            $push: {
              productId: "$cart.productId",
              quantity: "$cart.quantity",
              name: "$productDetails.name",
              price: "$productDetails.price",
              description: "$productDetails.description",
              image: "$productDetails.image",
              stock: "$productDetails.stock",
            },
          },
        },
      },
    ]);

    const cart = userWithCart[0]?.cartItems;

    res.status(200).json({
      status: "success",
      data: {
        cart,
      },
    });
  })
);

// To remove items from cart
router.delete(
  "/cart/:id",
  auth,
  catchAsync(async (req, res, next) => {
    const productId = req.params.id;
    const result = await UserModel.updateOne(
      { _id: req.user._id },
      {
        $pull: {
          cart: { productId: productId },
        },
      }
    );
    res.status(200).json({
      status: "success",
      message: "Item successfully removed",
    });
  })
);

// Dummy endpoint to upload data from postaman
router.post(
  "/",
  catchAsync(async (req, res, next) => {
    const data = await ProductModel.create(req.body.products);
    res.status(200).json({
      status: "success",
      message: "Data added successfully",
    });
  })
);

module.exports = router;
