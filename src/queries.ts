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
  postId?: number
) {
  if (profileId) {
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
        where: { id: post?.profileId },
      });
      if (profile?.userId === userId) {
        return true;
      }
    }
  }

  return false;
}

// post queries
async function createPostForProfile(profileId: number, text: string) {
  const post = await prisma.post.create({
    data: { profileId, text },
  });
  return post || null;
}

async function readPostFromDatabase(id: number) {
  const post = await prisma.post.findFirst({ where: { id } });
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
  // if a user already exists with that email then return false
  const count = await prisma.user.count({
    where: { email },
  });
  if (count > 0) {
    return false;
  }

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
  const user = await prisma.user.findFirst({
    where: { id },
  });
  if (!user) {
    return false;
  }

  const deletedUser = await prisma.user.delete({
    where: { id },
  });

  if (!deletedUser) {
    return false;
  }

  return deletedUser;
}

async function getUser(email: string) {
  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    return null;
  }

  return user;
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
  const allUsers = await prisma.user.findMany({});
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      email,
      hash,
    },
  });

  if (updatedUser) {
    return updatedUser;
  }
  return false;
}

export {
  // security queries
  checkOwnerFromDatabase,

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

  // user queries
  addUser,
  deleteSingleUser,
  getUser,
  getUserEmail,
  updateUserInfo,
};
