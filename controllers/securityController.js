const jwt = require("jsonwebtoken");
require("dotenv").config();
const {
  generateIndividualErrorMessage,
  getTokenFromReq,
  getUserInfoFromToken,
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
  const userId = Number(req.params.userId) || false;
  const profileId = Number(req.params.profileId) || false;
  const postId = Number(req.params.postId) || false;
  const commentId = Number(req.params.commentId) || false;
  const followId = Number(req.params.followId) || false;
  const likeId = Number(req.params.likeId) || false;

  if (!userId && !profileId && !postId && !commentId && !followId && !likeId) {
    return res
      .status(400)
      .json(generateIndividualErrorMessage("No valid req.params were found."));
  } else if (
    (!userId && req.params.userId) ||
    (!profileId && req.params.profileId) ||
    (!postId && req.params.postId) ||
    (!commentId && req.params.commentId) ||
    (!followId && req.params.followId) ||
    (!likeId && req.params.likeId)
  ) {
    return res
      .status(400)
      .json(
        generateIndividualErrorMessage("Not all of your req.params were valid.")
      );
  }

  if (userId) {
    req.userId = userId;
  }
  if (profileId) {
    req.profileId = profileId;
  }
  if (postId) {
    req.postId = postId;
  }
  if (commentId) {
    req.commentId = commentId;
  }
  if (followId) {
    req.followId = followId;
  }
  if (likeId) {
    req.likeId = likeId;
  }

  next();
}

// external functions
function sign(user) {
  const token = jwt.sign({ user }, secretKey);
  return token;
}

async function verifyTokenMatch(req, res, next) {
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
  checkThatParamsAreValid,
  sign,
  verifyTokenMatch,
  verifyTokenValid,
};
