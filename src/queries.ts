import { PrismaClient } from "../generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";
require("dotenv");

const databaseUrl =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },

  // need to fix this line after Emmet paste to add dollar sign before extends
}).$extends(withAccelerate());

// security queries
async function checkOwnerFromDatabase(
  userId: number,
  profileId?: number,
  postId?: number,
  commentId?: number,
  followerId?: number,
  followId?: number,
  deleteFollowId?: number
) {
  if (profileId && !followerId) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId },
    });
    if (profile) {
      const userIdOfProfile = profile.userId;
      if (userIdOfProfile === userId) {
        return true;
      }
    }
  }
  if (postId) {
    const post = await prisma.post.findFirst({ where: { id: postId } });
    if (post) {
      const profile = await prisma.profile.findFirst({
        where: { id: post.profileId },
      });
      if (profile?.userId === userId) {
        return true;
      }
    }
  }
  if (commentId) {
    const comment = await readSingleComment(commentId);
    if (comment) {
      const profile = await prisma.profile.findFirst({
        where: { id: comment.profileId },
      });
      if (profile?.userId === userId) {
        return true;
      }
    }
  }
  if (followerId) {
    const followerProfile = await prisma.profile.findFirst({
      where: { id: followerId },
    });

    if (followerProfile?.userId === userId) {
      return true;
    }
  }
  if (followId) {
    const follow = await prisma.follow.findFirst({
      where: { id: followId },
      select: {
        following: {
          select: {
            userId: true,
          },
        },
      },
    });
    const followedUserId = follow?.following.userId;

    return followedUserId === userId;
  }
  if (deleteFollowId) {
    const follow = await prisma.follow.findFirst({
      where: { id: deleteFollowId },
      select: {
        following: {
          select: {
            userId: true,
          },
        },
        follower: {
          select: {
            userId: true,
          },
        },
      },
    });
    const followedUserId = follow?.following.userId;
    const followingUserId = follow?.follower.userId;

    return userId === followedUserId || userId === followingUserId;
  }

  return false;
}

// comment queries
async function createCommentReply(
  commentId: number,
  text: string,
  profileId: number
) {
  const comment = await prisma.comment.create({
    data: {
      commentId,
      text,
      profileId,
    },
  });

  return comment || null;
}

async function createCommentOnPost(
  postId: number,
  profileId: number,
  text: string
) {
  const comment = await prisma.comment.create({
    data: { postId, profileId, text },
  });

  return comment || null;
}

async function readCommentReplies(commentId: number) {
  const comments = await prisma.comment.findMany({
    where: { commentId },
    select: {
      id: true,
      text: true,
      profileId: true,
      Profile: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
  });

  return comments;
}

async function readCommentsOnPost(postId: number) {
  const comments = await prisma.comment.findMany({
    where: { postId },
    select: {
      id: true,
      text: true,
      profileId: true,
      Profile: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
  });

  return comments;
}

async function readSingleComment(id: number) {
  const comment = await prisma.comment.findFirst({ where: { id } });
  return comment || null;
}

async function updateCommentInDatabase(id: number, text: string) {
  const commentWithUpdates = await prisma.comment.update({
    where: { id },
    data: { text },
  });
  return commentWithUpdates || null;
}

async function deleteCommentFromDatabase(id: number) {
  const oldComment = await prisma.comment.delete({ where: { id } });
  return oldComment || null;
}

// follow queries
async function createNewFollow(followerId: number, followingId: number) {
  const newFollow = await prisma.follow.create({
    data: {
      followerId,
      followingId,
    },
  });

  return newFollow || null;
}

async function readFollowers(profileId: number) {
  const profileCount = await prisma.profile.count({ where: { id: profileId } });
  if (profileCount === 0) {
    return null;
  }

  const followers = await prisma.follow.findMany({
    where: {
      followingId: profileId,
    },
    select: {
      follower: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return followers;
}

async function readFollowing(profileId: number) {
  const profile = await prisma.profile.count({ where: { id: profileId } });
  if (!profile) return null;

  const following = await prisma.follow.findMany({
    where: { followerId: profileId },
    select: {
      following: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return following;
}

async function updateFollowAccept(followId: number, accepted: boolean) {
  const update = await prisma.follow.update({
    where: { id: followId },
    data: { accepted },
  });

  return update || null;
}

async function deleteFollowInDatabase(followId: number) {
  const deletedFollow = await prisma.follow.delete({ where: { id: followId } });
  return deletedFollow || null;
}

// like queries
async function createLikeComment(commentId: number, profileId: number) {
  const commentCount = await prisma.comment.count({ where: { id: commentId } });
  if (commentCount === 0) {
    return false;
  }

  const like = await prisma.like.create({
    data: { profileId, commentId },
  });

  return like || null;
}

async function createLikePost(postId: number, profileId: number) {}

async function deleteLikeFromDatabase(likeId: number) {}

// post queries
async function createPostForProfile(profileId: number, text: string) {
  const post = await prisma.post.create({
    data: { profileId, text },
  });
  return post || null;
}

async function readPostFromDatabase(id: number) {
  const post = await prisma.post.findFirst({
    where: { id },
    include: {
      _count: {
        select: { comments: true, likes: true },
      },
    },
  });
  return post;
}

async function updatePostText(id: number, text: string) {
  const post = await prisma.post.update({ where: { id }, data: { text } });
  return post;
}

async function deletePostFromDatabase(id: number) {
  const post = await prisma.post.delete({ where: { id } });
  if (!post) {
    return false;
  }
  return post;
}

// profile queries
async function addProfile(
  userId: number,
  name: string,
  about?: string,
  website?: string
) {
  const newProfile = await prisma.profile.create({
    data: { userId, name, about, website },
  });

  return newProfile;
}

async function deleteUserProfile(id: number) {
  const deletedProfile = await prisma.profile.delete({ where: { id } });
  return deletedProfile || false;
}

async function getProfile(id: number) {
  const profile = await prisma.profile.findFirst({
    where: { id },
  });

  return profile || false;
}

async function updateExistingProfile(
  id: number,
  userId: number,
  name: string,
  website?: string,
  about?: string
) {
  const updatedProfile = await prisma.profile.update({
    where: { id, userId },
    data: { name, website: website, about: about },
  });
  return updatedProfile || null;
}

// user queries
async function addUser(email: string, hash: string) {
  const user = await prisma.user.create({
    data: {
      email,
      hash,
    },
  });

  const id = user.id;
  return id;
}

async function deleteSingleUser(id: number) {
  const deletedUser = await prisma.user.delete({
    where: { id },
  });

  return deletedUser || null;
}

async function deleteAllUsers() {
  const deleted = await prisma.user.deleteMany({});
  return deleted;
}

async function getUser(email: string) {
  const user = await prisma.user.findFirst({
    where: { email },
  });

  return user || null;
}

async function getUserEmail(id: number) {
  const user = await prisma.user.findFirst({
    where: { id },
  });

  if (!user) {
    return null;
  }

  return user.email;
}

async function updateUserInfo(id: number, email: string, hash: string) {
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      email,
      hash,
    },
  });

  return updatedUser || null;
}

export {
  // comment queries
  createCommentReply,
  createCommentOnPost,
  readCommentReplies,
  readCommentsOnPost,
  readSingleComment,
  updateCommentInDatabase,
  deleteCommentFromDatabase,

  // follow queries
  createNewFollow,
  readFollowers,
  readFollowing,
  updateFollowAccept,
  deleteFollowInDatabase,

  // like queries
  createLikeComment,
  createLikePost,
  deleteLikeFromDatabase,

  // post queries
  createPostForProfile,
  readPostFromDatabase,
  updatePostText,
  deletePostFromDatabase,

  // profile queries
  addProfile,
  deleteUserProfile,
  getProfile,
  updateExistingProfile,

  // security queries
  checkOwnerFromDatabase,

  // user queries
  addUser,
  deleteSingleUser,
  deleteAllUsers,
  getUser,
  getUserEmail,
  updateUserInfo,
};
