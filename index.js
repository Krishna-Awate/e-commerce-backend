const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
require("./database/mongoose");
const cookieParser = require("cookie-parser");

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Error handling function
const { globalErrorHandler } = require("./utils/error");

// Routes
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

app.use("/api", productRoutes);
app.use("/api", userRoutes);
app.use("/api", paymentRoutes);

// Globle level error handling
app.use(globalErrorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Your app is running on port ${process.env.PORT}`);
});
