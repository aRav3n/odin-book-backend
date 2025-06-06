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
  // profile queries
  addProfile,
  // user queries
  addUser,
  deleteSingleUser,
  getUser,
  getUserEmail,
  updateUserInfo,
};
