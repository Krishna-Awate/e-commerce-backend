const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    name: {
      type: String,
      require: [true, "Name is required"],
    },
    email: {
      type: String,
      require: [true, "Email address is required"],
    },
    phone: {
      type: Number,
      require: [true, "Phone number is required"],
    },
    address: {
      type: String,
    },
    amount: {
      type: Number,
    },
    orderId: {
      type: String,
    },
    paymentStatus: {
      type: String,
    },
    productDetails: {
      type: Object,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Payment = mongoose.model("payment", paymentSchema);

module.exports = Payment;
