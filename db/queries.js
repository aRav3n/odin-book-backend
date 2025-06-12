"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentOnPost = createCommentOnPost;
exports.createPostForProfile = createPostForProfile;
exports.readPostFromDatabase = readPostFromDatabase;
exports.updatePostText = updatePostText;
exports.deletePostFromDatabase = deletePostFromDatabase;
exports.addProfile = addProfile;
exports.deleteUserProfile = deleteUserProfile;
exports.getProfile = getProfile;
exports.updateExistingProfile = updateExistingProfile;
exports.checkOwnerFromDatabase = checkOwnerFromDatabase;
exports.addUser = addUser;
exports.deleteSingleUser = deleteSingleUser;
exports.getUser = getUser;
exports.getUserEmail = getUserEmail;
exports.updateUserInfo = updateUserInfo;
const prisma_1 = require("../generated/prisma");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
require("dotenv");
const databaseUrl = process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;
const prisma = new prisma_1.PrismaClient({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
    // need to fix this line after Emmet paste to add dollar sign before extends
}).$extends((0, extension_accelerate_1.withAccelerate)());
// comment queries
function createCommentOnPost(postId, profileId, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const comment = yield prisma.comment.create({
            data: { postId, profileId, text },
        });
        return comment || null;
    });
}
// post queries
function createPostForProfile(profileId, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const post = yield prisma.post.create({
            data: { profileId, text },
        });
        return post || null;
    });
}
function readPostFromDatabase(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const post = yield prisma.post.findFirst({
            where: { id },
            include: {
                _count: {
                    select: { comments: true, likes: true },
                },
            },
        });
        return post;
    });
}
function updatePostText(id, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const post = yield prisma.post.update({ where: { id }, data: { text } });
        return post;
    });
}
function deletePostFromDatabase(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const post = yield prisma.post.delete({ where: { id } });
        if (!post) {
            return false;
        }
        return post;
    });
}
// profile queries
function addProfile(userId, name, about, website) {
    return __awaiter(this, void 0, void 0, function* () {
        const newProfile = yield prisma.profile.create({
            data: { userId, name, about, website },
        });
        return newProfile;
    });
}
function deleteUserProfile(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const deletedProfile = yield prisma.profile.delete({ where: { id } });
        return deletedProfile || false;
    });
}
function getProfile(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = yield prisma.profile.findFirst({
            where: { id },
        });
        return profile || false;
    });
}
function updateExistingProfile(id, userId, name, website, about) {
    return __awaiter(this, void 0, void 0, function* () {
        const updatedProfile = yield prisma.profile.update({
            where: { id, userId },
            data: { name, website: website, about: about },
        });
        return updatedProfile || null;
    });
}
// security queries
function checkOwnerFromDatabase(userId, profileId, postId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (profileId) {
            const profile = yield prisma.profile.findFirst({
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
            const post = yield prisma.post.findFirst({ where: { id: postId } });
            if (post) {
                const profile = yield prisma.profile.findFirst({
                    where: { id: post === null || post === void 0 ? void 0 : post.profileId },
                });
                if ((profile === null || profile === void 0 ? void 0 : profile.userId) === userId) {
                    return true;
                }
            }
        }
        return false;
    });
}
// user queries
function addUser(email, hash) {
    return __awaiter(this, void 0, void 0, function* () {
        // if a user already exists with that email then return false
        const count = yield prisma.user.count({
            where: { email },
        });
        if (count > 0) {
            return false;
        }
        const user = yield prisma.user.create({
            data: {
                email,
                hash,
            },
        });
        const id = user.id;
        return id;
    });
}
function deleteSingleUser(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma.user.findFirst({
            where: { id },
        });
        if (!user) {
            return false;
        }
        const deletedUser = yield prisma.user.delete({
            where: { id },
        });
        if (!deletedUser) {
            return false;
        }
        return deletedUser;
    });
}
function getUser(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma.user.findFirst({
            where: { email },
        });
        if (!user) {
            return null;
        }
        return user;
    });
}
function getUserEmail(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma.user.findFirst({
            where: { id },
        });
        if (!user) {
            return null;
        }
        return user.email;
    });
}
function updateUserInfo(id, email, hash) {
    return __awaiter(this, void 0, void 0, function* () {
        const allUsers = yield prisma.user.findMany({});
        const updatedUser = yield prisma.user.update({
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
    });
}
