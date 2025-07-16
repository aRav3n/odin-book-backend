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
  deleteFollowId?: number,
  likeId?: number
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
  if (likeId) {
    const like = await prisma.like.findFirst({
      where: { id: likeId },
      select: {
        Profile: {
          select: {
            userId: true,
          },
        },
      },
    });
    const likeUserId = like?.Profile.userId;

    return likeUserId === userId;
  }

  return false;
}

// other internal queries
async function readProfileIdFromUserId(userId?: number) {
  if (!userId) {
    return 0;
  }
  const profile = await prisma.profile.findFirst({
    where: { userId },
  });

  const profileId = profile?.id || 0;

  return profileId;
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
    select: {
      id: true,
      text: true,
      profileId: true,
      postId: true,
      commentId: true,
      Profile: {
        select: {
          name: true,
          id: true,
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

  return comment || null;
}

async function createCommentOnPost(
  postId: number,
  profileId: number,
  text: string
) {
  const comment = await prisma.comment.create({
    data: { postId, profileId, text },
    select: {
      id: true,
      text: true,
      profileId: true,
      postId: true,
      commentId: true,
      Profile: {
        select: {
          name: true,
          id: true,
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

  return comment || null;
}

async function readCommentReplies(commentId: number, userId?: number) {
  const profileId = await readProfileIdFromUserId(userId);
  const comments = await prisma.comment.findMany({
    where: { commentId },
    select: {
      id: true,
      text: true,
      profileId: true,
      postId: true,
      commentId: true,
      Profile: {
        select: {
          name: true,
          id: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
      likes: {
        where: { profileId },
        select: { id: true },
      },
    },
  });

  return comments;
}

async function readCommentsOnPost(postId: number, userId?: number) {
  const profileId = await readProfileIdFromUserId(userId);

  const comments = await prisma.comment.findMany({
    where: { postId },
    select: {
      id: true,
      text: true,
      profileId: true,
      postId: true,
      commentId: true,
      Profile: {
        select: {
          name: true,
          id: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
      likes: {
        where: { profileId },
        select: { id: true },
      },
    },
  });

  return comments;
}

async function readSingleComment(id: number, userId?: number) {
  const profileId = await readProfileIdFromUserId(userId);

  const comment = await prisma.comment.findFirst({
    where: { id },
    select: {
      id: true,
      text: true,
      profileId: true,
      postId: true,
      commentId: true,
      Profile: {
        select: {
          name: true,
          id: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
      likes: {
        where: { profileId },
        select: { id: true },
      },
    },
  });
  return comment || null;
}

async function updateCommentInDatabase(id: number, text: string) {
  const commentWithUpdates = await prisma.comment.update({
    where: { id },
    data: { text },
    select: {
      id: true,
      text: true,
      profileId: true,
      postId: true,
      commentId: true,
      Profile: {
        select: {
          name: true,
          id: true,
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
          avatarUrl: true,
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
          avatarUrl: true,
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

async function createLikePost(postId: number, profileId: number) {
  const postCount = await prisma.post.count({ where: { id: postId } });
  if (postCount === 0) {
    return false;
  }

  const like = await prisma.like.create({
    data: { profileId, postId },
  });

  return like || null;
}

async function deleteLikeFromDatabase(likeId: number) {
  const like = await prisma.like.delete({ where: { id: likeId } });
  return like || null;
}

// post queries
async function createPostForProfile(profileId: number, text: string) {
  const post = await prisma.post.create({
    data: { profileId, text },
    select: {
      id: true,
      createdAt: true,
      text: true,
      profileId: true,
      Profile: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });
  return post || null;
}

async function readPostFromDatabase(id: number, userId?: number) {
  const profileId = await readProfileIdFromUserId(userId);

  const post = await prisma.post.findFirst({
    where: { id },
    include: {
      Profile: {
        select: {
          name: true,
          id: true,
        },
      },
      _count: {
        select: { comments: true, likes: true },
      },
      likes: {
        where: { profileId },
        select: { id: true },
      },
    },
  });

  return post;
}

async function readRecentPostsFromDatabase(start: number, userId?: number) {
  const profileId = await readProfileIdFromUserId(userId);

  const take = 10;
  const skip = start - 1;
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      Profile: {
        select: {
          name: true,
          id: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: { comments: true, likes: true },
      },
      likes: {
        where: { profileId },
        select: { id: true },
      },
    },
  });

  return posts;
}

async function updatePostText(id: number, text: string) {
  const post = await prisma.post.update({
    where: { id },
    data: { text },
    select: {
      id: true,
      createdAt: true,
      text: true,
      profileId: true,
      Profile: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });
  return post;
}

async function deletePostFromDatabase(id: number) {
  const post = await prisma.post.delete({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      text: true,
      profileId: true,
      Profile: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });
  if (!post) {
    return false;
  }
  return post;
}

// profile queries
async function addAnonProfile(
  name: string,
  about: string,
  website: string,
  avatarUrl: string,
  email: string,
  hash: string
) {
  const userCount = await prisma.user.count({ where: { email } });
  if (userCount > 0) {
    await prisma.user.delete({ where: { email } });
  }

  const user = await prisma.user.create({
    data: { email, hash },
    select: { id: true, email: true },
  });
  if (!user) {
    return null;
  }
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      name,
      website,
      about,
      avatarUrl,
    },
  });

  return { user, profile };
}

async function addProfile(
  userId: number,
  name: string,
  about?: string,
  website?: string,
  avatarUrl?: string
) {
  const newProfile = await prisma.profile.create({
    data: { userId, name, about, website, avatarUrl },
  });

  return newProfile;
}

async function deleteUserProfile(id: number) {
  const deletedProfile = await prisma.profile.delete({ where: { id } });
  return deletedProfile || false;
}

async function getProfile(id: number, requestingProfileId: number) {
  const profile = await prisma.profile.findFirst({
    where: { id },
    select: {
      id: true,
      userId: true,
      name: true,
      website: true,
      about: true,
      avatarUrl: true,
      posts: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { comments: true, likes: true },
          },
          likes: {
            where: { profileId: requestingProfileId },
            select: { id: true },
          },
          Profile: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return profile || false;
}

async function getProfileList(string?: string) {
  const hasString = string && string.length > 0 ? true : false;

  const profileList = hasString
    ? await prisma.profile.findMany({
        orderBy: { name: "asc" },
        where: {
          name: {
            contains: string,
            mode: "insensitive",
          },
        },
      })
    : await prisma.profile.findMany({
        orderBy: { name: "asc" },
      });

  return profileList || null;
}

async function getUserProfile(userId: number) {
  const profile = await prisma.profile.findFirst({
    where: { userId },
    select: {
      id: true,
      userId: true,
      name: true,
      website: true,
      about: true,
      avatarUrl: true,
    },
  });

  return profile || false;
}

async function updateExistingProfile(
  id: number,
  userId: number,
  name: string,
  website?: string,
  about?: string,
  avatarUrl?: string
) {
  const updatedProfile = await prisma.profile.update({
    where: { id, userId },
    data: { name, website, about, avatarUrl },
    select: {
      id: true,
      posts: true,
      userId: true,
      name: true,
      website: true,
      about: true,
      avatarUrl: true,
    },
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
  readRecentPostsFromDatabase,
  updatePostText,
  deletePostFromDatabase,

  // profile queries
  addAnonProfile,
  addProfile,
  deleteUserProfile,
  getProfile,
  getProfileList,
  getUserProfile,
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
