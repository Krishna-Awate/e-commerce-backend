const jwt = require("jsonwebtoken");
const { catchAsync } = require("../utils/error");
const AppError = require("../utils/appError");
const UsersModel = require("../models/usersModel");

// Authorization using JWT middleware
const auth = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await UsersModel.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("User does not exist", 404));
  }
  req.user = currentUser;
  next();
});

module.exports = auth;
