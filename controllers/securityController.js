const jwt = require("jsonwebtoken");
require("dotenv");

const secretKey = process.env.SECRET_KEY;

async function sign(user) {
  return new Promise((resolve, reject) => {
    jwt.sign({ user }, secretKey, async (err, token) => {
      if (err) {
        reject(err);
      }
      resolve(token);
    });
  });
}

module.exports = { sign };
