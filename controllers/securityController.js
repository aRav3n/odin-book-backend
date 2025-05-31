const jwt = require("jsonwebtoken");
require("dotenv").config();

const secretKey = process.env.SECRET_KEY;

function sign(user) {
  const token = jwt.sign({ user }, secretKey);
  return token;
}

module.exports = { sign };
