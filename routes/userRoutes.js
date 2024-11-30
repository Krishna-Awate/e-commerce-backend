const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { catchAsync } = require("../utils/error");
const AppError = require("../utils/appError");
const UsersModel = require("../models/usersModel");
const auth = require("../middleware/auth");
const sendMail = require("../utils/sendMail");

// To singup new user
router.post(
  "/user/signup",
  catchAsync(async (req, res, next) => {
    const { name, email, phone, password, protocol, host } = req.body;
    const user = await UsersModel.findOne({ email });
    if (user) {
      return next(
        new AppError(`An account with email ${email} already exists.`, 400)
      );
    }
    const createUser = await UsersModel.create({
      name,
      email,
      phone,
      password,
    });

    const userData = await UsersModel.findOne({ _id: createUser._id }).select(
      "-password -password_reset_token -password_reset_expires -email_verify_token"
    );

    const resetToken = await userData?.createEmailVerifyToken();
    await userData.save();
    const resetLink = `${protocol}//${host}/auth/email-verify/${resetToken}`;

    const mailData = {
      to: userData.email,
      name: userData.name,
      subject: "Verify your email address",
      title: "Verify Your Email Address",
      resetLink: resetLink,
      templateName: "emailVerify",
    };
    sendMail(mailData);

    res.status(200).json({
      status: "success",
      data: {
        user: userData,
      },
    });
  })
);

// User login
router.post(
  "/user/login",
  catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    // 2) If email exist and password is correct
    const user = await UsersModel.findOne({ email }).select(
      "-password_reset_token -password_reset_expires -email_verify_token -role"
    );
    const correct = await user?.correctPassword(password, user.password);

    // If user is not found or password is incorrect
    if (!user || !correct) {
      return next(new AppError("Incorrect email or password", 401));
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    user.password = undefined;

    res
      .status(200)
      .cookie("cookie", { express: new Date(Date.now() + 10000) })
      .json({
        status: "success",
        token,
        data: {
          user,
        },
      });
  })
);

// Forget password
router.post(
  "/user/forgotPassword",
  catchAsync(async (req, res, next) => {
    const { email, protocol, host } = req.body;
    const user = await UsersModel.findOne({ email: email });
    if (!user) {
      return next(
        new AppError("There is no user with this email address", 404)
      );
    }
    const resetToken = await user.createPasswordResetToken();
    await user.save();
    const resetLink = `${protocol}//${host}/auth/reset-password/${resetToken}`;

    const mailData = {
      to: user.email,
      subject: "Reset Password",
      title: "Reset your password",
      resetLink: resetLink,
      templateName: "forgotPassword",
    };
    sendMail(mailData);

    res.status(200).json({
      status: "success",
      resetToken,
    });
  })
);

// validate token to reset password
router.post(
  "/user/resetPassword/:token",
  catchAsync(async (req, res, next) => {
    const resetToken = req.params.token;

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await UsersModel.findOne({
      password_reset_token: hashedToken,
      password_reset_expires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Token is invalid or expired", 400));
    }

    user.password = req.body.password;
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(200).json({
      status: "success",
      token,
    });
  })
);

//New user email verify
router.post(
  "/user/emailVerify/:token",
  catchAsync(async (req, res, next) => {
    const resetToken = req.params.token;
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await UsersModel.findOne({
      email_verify_token: hashedToken,
    }).select(
      "-password -password_reset_token -password_reset_expires -email_verify_token -role"
    );

    if (!user) {
      return next(new AppError("Token is invalid", 400));
    }

    user.is_email_verified = true;
    user.email_verify_token = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(200).json({
      status: "success",
      token,
      data: { user },
    });
  })
);

// Resend verification email if not received while sign up
router.post(
  "/user/resend-verification-email",
  catchAsync(async (req, res, next) => {
    const { email, protocol, host } = req.body;
    const user = await UsersModel.findOne({
      email: email,
    });

    if (!user) {
      return next(new AppError("User not found", 400));
    }

    const resetToken = await user?.createEmailVerifyToken();
    await user.save();
    const resetLink = `${protocol}//${host}/auth/email-verify/${resetToken}`;

    const mailData = {
      to: user.email,
      name: user.name,
      subject: "Verify your email address",
      title: "Verify Your Email Address",
      resetLink: resetLink,
      templateName: "emailVerify",
    };
    sendMail(mailData);

    res.status(200).json({
      status: "success",
      message:
        "A verification link has been successfully sent to your email. Kindly verify your email address",
    });
  })
);

// Get logged in user data
router.get(
  "/user",
  auth,
  catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const user = await UsersModel.findById(req.user._id)
      .select("name email phone created_at _id role")
      .lean();

    res.status(200).json({
      status: "success",
      user: user,
    });
  })
);

module.exports = router;
