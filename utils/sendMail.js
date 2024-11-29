const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

// Node mailer
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_SECRET,
  },
});

const sendMail = (data) => {
  const source = fs.readFileSync(
    path.join(__dirname, `../templates/${data.templateName}.hbs`),
    "utf8"
  );
  const template = handlebars.compile(source);

  // Nodemailer
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: data.to,
    subject: data.subject,
    html: template(data),
  };

  // Send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("Error:", error);
    }
    console.log("Message sent: %s", info.messageId);
  });
};

module.exports = sendMail;
