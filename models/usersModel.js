const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "Name is required"],
    },
    email: {
      type: String,
      unique: true,
      require: [true, "Email address is required"],
    },
    phone: {
      type: Number,
      require: [true, "Phone number is required"],
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    email_verify_token: {
      type: String,
    },
    password_reset_token: { type: String },
    password_reset_expires: Date,
    cart: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// To encrypt passoword before document save or update
userSchema.pre("save", async function (next) {
  // This function only runs if password is modified
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// To check passoword is correct
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Create passoword reset token
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.password_reset_token = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.password_reset_expires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// Create verifiy email  token
userSchema.methods.createEmailVerifyToken = async function () {
  const emailVerifyToken = crypto.randomBytes(32).toString("hex");
  this.email_verify_token = crypto
    .createHash("sha256")
    .update(emailVerifyToken)
    .digest("hex");
  return emailVerifyToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
