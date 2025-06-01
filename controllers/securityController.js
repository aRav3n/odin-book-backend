const jwt = require("jsonwebtoken");
require("dotenv").config();
const {
  generateIndividualErrorMessage,
  getTokenFromReq,
  getUserInfoFromToken,
} = require("./internalFunctions");

const secretKey = process.env.SECRET_KEY;

// external functions
function sign(user) {
  const token = jwt.sign({ user }, secretKey);
  return token;
}

function verifyTokenMatch(req, res, next) {
  const requestedUserId = Number(req.params.userId);

  if (req.user.user.id !== requestedUserId) {
    return res
      .status(403)
      .json(
        generateIndividualErrorMessage(
          "You have to be logged in to your account to access that."
        )
      );
  }

  next();
}

function verifyTokenValid(req, res, next) {
  const token = getTokenFromReq(req);
  if (!token) {
    return res
      .status(401)
      .json(
        generateIndividualErrorMessage("You must be logged in to do that.")
      );
  }

  const tokenUserInfo = getUserInfoFromToken(token, secretKey);

  if (!tokenUserInfo) {
    return res
      .status(401)
      .json(
        generateIndividualErrorMessage("Please sign in again and re-try that.")
      );
  }

  req.user = tokenUserInfo;
  next();
}

module.exports = { sign, verifyTokenMatch, verifyTokenValid };
