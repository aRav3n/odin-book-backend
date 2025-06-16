const jwt = require("jsonwebtoken");
require("dotenv").config();
const {
  checkTokenForIssues,
  generateIndividualErrorMessage,
  getTokenFromReq,
  getUserInfoFromToken,
  generateErrorMessageFromArray,
} = require("./internalFunctions");
const {
  getProfile,
  checkOwnerFromDatabase,
  readSingleComment,
} = require("../db/queries");

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

function checkThatParamsAreValid(req, res, next) {
  let paramCount = 0;
  const errorArray = [];
  for (const param in req.params) {
    paramCount++;
    if (isNaN(req.params[param])) {
      errorArray.push(`The param ${param} must be a number.`);
    } else {
      req[param] = Number(req.params[param]);
    }
  }

  if (paramCount === 0) {
    return res
      .status(400)
      .json(generateIndividualErrorMessage("No valid req.params were found."));
  } else if (errorArray.length > 0) {
    return res.status(400).json(generateErrorMessageFromArray(errorArray));
  }

  next();
}

function sign(user) {
  const token = jwt.sign({ user }, secretKey);
  return token;
}

async function verifyTokenMatch(req, res, next) {
  const infoObject = checkTokenForIssues(req, secretKey);
  if (infoObject.errorMessage) {
    return res.status(infoObject.status).json(infoObject.errorMessage);
  }
  req.user = infoObject.tokenUserInfo;

  if (req.userId) {
    if (req.user.user.id !== req.userId) {
      return res
        .status(403)
        .json(
          generateIndividualErrorMessage(
            "You have to be logged in to your account to access that."
          )
        );
    }
  } else if (req.profileId) {
    const owner = await checkOwnerFromDatabase(
      req.user.user.id,
      req.profileId,
      null,
      null
    );
    if (!owner) {
      return res
        .status(403)
        .json(
          generateIndividualErrorMessage(
            "Access to that profile is not allowed from this account."
          )
        );
    }
  } else if (req.postId) {
    const owner = await checkOwnerFromDatabase(
      req.user.user.id,
      null,
      req.postId,
      null
    );

    if (!owner) {
      return res
        .status(403)
        .json(
          generateIndividualErrorMessage(
            "Access to that post is not allowed from this account."
          )
        );
    }
  } else if (req.commentId) {
    const owner = await checkOwnerFromDatabase(
      req.user.user.id,
      null,
      null,
      req.commentId
    );

    if (!owner) {
      return res
        .status(403)
        .json(
          generateIndividualErrorMessage(
            "Access to that post is not allowed from this account."
          )
        );
    }
  } else if (req.followId) {
  } else if (req.likeId) {
  } else {
    return res
      .status(400)
      .json(generateIndividualErrorMessage("No valid req.params were found."));
  }
  next();
}

function verifyTokenValid(req, res, next) {
  const infoObject = checkTokenForIssues(req, secretKey);
  if (infoObject.errorMessage) {
    return res.status(infoObject.status).json(infoObject.errorMessage);
  }
  req.user = infoObject.tokenUserInfo;
  next();
}

module.exports = {
  checkThatBodyExists,
  checkThatParamsAreValid,
  sign,
  verifyTokenMatch,
  verifyTokenValid,
};
