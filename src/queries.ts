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

async function deleteAllUsers() {
  const deletedUserCount = await prisma.user.deleteMany({});
  return deletedUserCount;
}

export { addUser, deleteAllUsers };
