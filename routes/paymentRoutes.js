const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { catchAsync } = require("../utils/error");
const AppError = require("../utils/appError");
const PaymentModel = require("../models/paymentModel");
const UserModel = require("../models/usersModel");
const ProductModel = require("../models/productModel");
const Razorpay = require("razorpay");
const auth = require("../middleware/auth");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Create an order
router.post(
  "/payments/order",
  auth,
  catchAsync(async (req, res, next) => {
    let { name, email, amount, phone, address } = req.body;

    if (!amount) {
      return next(new AppError("No amount found", 500));
    }
    amount = +amount * 100;

    const response = await instance.orders.create({
      amount: amount,
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        key1: "value3",
        key2: "value2",
      },
    });

    const createOrder = await PaymentModel.create({
      userId: req.user._id,
      name,
      email,
      amount: amount / 100,
      phone,
      address,
      orderId: response?.id,
      payementStatus: response?.status,
    });
    res.status(200).json({ status: "success", data: response });
  })
);

// After successful payment reduce stock and mark payment as succssful
router.post(
  "/payments/success",
  auth,
  catchAsync(async (req, res, next) => {
    let {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      amount,
      cart,
    } = req.body;

    const updatePayment = await PaymentModel.updateOne({
      orderId: razorpayOrderId,
      $set: {
        payementStatus: "success",
      },
    });

    // logic to reduce stock
    const operations = cart.map((item) => {
      return {
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(item.productId) },
          update: { $inc: { stock: -item.quantity } },
          upsert: false,
        },
      };
    });

    const result = await ProductModel.bulkWrite(operations);

    // Empty the cart
    const updateCart = await UserModel.updateOne({
      _id: req.user._id,
      $set: { cart: [] },
    });

    res.status(200).json({
      staus: "success",
      data: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
      },
    });
  })
);

module.exports = router;