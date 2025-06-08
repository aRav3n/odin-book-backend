const jwt = require("jsonwebtoken");
require("dotenv").config();
const {
  generateIndividualErrorMessage,
  getTokenFromReq,
  getUserInfoFromToken,
} = require("./internalFunctions");
const { getProfile } = require("../db/queries");

const secretKey = process.env.SECRET_KEY;

function checkThatBodyExists(req, res, next) {
  if (!req.body) {
    return res
      .status(400)
      .json(
        generateIndividualErrorMessage(
          "There was a problem with the form data submitted; fill it out again and re-submit."
        )
      );
  }
  next();
}

// external functions
function sign(user) {
  const token = jwt.sign({ user }, secretKey);
  return token;
}

async function verifyTokenMatch(req, res, next) {
  if (req.params.userId) {
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
  } else if (req.params.profileId || req.body.profileId) {
    const requestedProfileId =
      Number(req.params.profileId) || Number(req.body.profileId);
    const profile = await getProfile(requestedProfileId);
    if (req.user.user.id !== profile.userId) {
      return res
        .status(403)
        .json(
          generateIndividualErrorMessage(
            "Access to that profile is not allowed from this account."
          )
        );
    }
  } else {
    return res
      .status(400)
      .json(
        generateIndividualErrorMessage(
          "No valid req.params or profileId items were found."
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

module.exports = {
  checkThatBodyExists,
  sign,
  verifyTokenMatch,
  verifyTokenValid,
};
