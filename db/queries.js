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
exports.createCommentReply = createCommentReply;
exports.createCommentOnPost = createCommentOnPost;
exports.readCommentReplies = readCommentReplies;
exports.readCommentsOnPost = readCommentsOnPost;
exports.readSingleComment = readSingleComment;
exports.updateCommentInDatabase = updateCommentInDatabase;
exports.deleteCommentFromDatabase = deleteCommentFromDatabase;
exports.createNewFollow = createNewFollow;
exports.readFollowers = readFollowers;
exports.readFollowing = readFollowing;
exports.updateFollowAccept = updateFollowAccept;
exports.deleteFollowInDatabase = deleteFollowInDatabase;
exports.createLikeComment = createLikeComment;
exports.createLikePost = createLikePost;
exports.deleteLikeFromDatabase = deleteLikeFromDatabase;
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
exports.deleteAllUsers = deleteAllUsers;
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
// security queries
function checkOwnerFromDatabase(userId, profileId, postId, commentId, followerId, followId, deleteFollowId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (profileId && !followerId) {
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
                    where: { id: post.profileId },
                });
                if ((profile === null || profile === void 0 ? void 0 : profile.userId) === userId) {
                    return true;
                }
            }
        }
        if (commentId) {
            const comment = yield readSingleComment(commentId);
            if (comment) {
                const profile = yield prisma.profile.findFirst({
                    where: { id: comment.profileId },
                });
                if ((profile === null || profile === void 0 ? void 0 : profile.userId) === userId) {
                    return true;
                }
            }
        }
        if (followerId) {
            const followerProfile = yield prisma.profile.findFirst({
                where: { id: followerId },
            });
            if ((followerProfile === null || followerProfile === void 0 ? void 0 : followerProfile.userId) === userId) {
                return true;
            }
        }
        if (followId) {
            const follow = yield prisma.follow.findFirst({
                where: { id: followId },
                select: {
                    following: {
                        select: {
                            userId: true,
                        },
                    },
                },
            });
            const followedUserId = follow === null || follow === void 0 ? void 0 : follow.following.userId;
            return followedUserId === userId;
        }
        if (deleteFollowId) {
            const follow = yield prisma.follow.findFirst({
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
            const followedUserId = follow === null || follow === void 0 ? void 0 : follow.following.userId;
            const followingUserId = follow === null || follow === void 0 ? void 0 : follow.follower.userId;
            return userId === followedUserId || userId === followingUserId;
        }
        return false;
    });
}
// comment queries
function createCommentReply(commentId, text, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const comment = yield prisma.comment.create({
            data: {
                commentId,
                text,
                profileId,
            },
        });
        return comment || null;
    });
}
function createCommentOnPost(postId, profileId, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const comment = yield prisma.comment.create({
            data: { postId, profileId, text },
        });
        return comment || null;
    });
}
function readCommentReplies(commentId) {
    return __awaiter(this, void 0, void 0, function* () {
        const comments = yield prisma.comment.findMany({
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
    });
}
function readCommentsOnPost(postId) {
    return __awaiter(this, void 0, void 0, function* () {
        const comments = yield prisma.comment.findMany({
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
    });
}
function readSingleComment(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const comment = yield prisma.comment.findFirst({ where: { id } });
        return comment || null;
    });
}
function updateCommentInDatabase(id, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const commentWithUpdates = yield prisma.comment.update({
            where: { id },
            data: { text },
        });
        return commentWithUpdates || null;
    });
}
function deleteCommentFromDatabase(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const oldComment = yield prisma.comment.delete({ where: { id } });
        return oldComment || null;
    });
}
// follow queries
function createNewFollow(followerId, followingId) {
    return __awaiter(this, void 0, void 0, function* () {
        const newFollow = yield prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
        });
        return newFollow || null;
    });
}
function readFollowers(profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const profileCount = yield prisma.profile.count({ where: { id: profileId } });
        if (profileCount === 0) {
            return null;
        }
        const followers = yield prisma.follow.findMany({
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
    });
}
function readFollowing(profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = yield prisma.profile.count({ where: { id: profileId } });
        if (!profile)
            return null;
        const following = yield prisma.follow.findMany({
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
    });
}
function updateFollowAccept(followId, accepted) {
    return __awaiter(this, void 0, void 0, function* () {
        const update = yield prisma.follow.update({
            where: { id: followId },
            data: { accepted },
        });
        return update || null;
    });
}
function deleteFollowInDatabase(followId) {
    return __awaiter(this, void 0, void 0, function* () {
        const deletedFollow = yield prisma.follow.delete({ where: { id: followId } });
        return deletedFollow || null;
    });
}
// like queries
function createLikeComment(commentId, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const commentCount = yield prisma.comment.count({ where: { id: commentId } });
        if (commentCount === 0) {
            return false;
        }
        const like = yield prisma.like.create({
            data: { profileId, commentId },
        });
        return like || null;
    });
}
function createLikePost(postId, profileId) {
    return __awaiter(this, void 0, void 0, function* () { });
}
function deleteLikeFromDatabase(likeId) {
    return __awaiter(this, void 0, void 0, function* () { });
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
// user queries
function addUser(email, hash) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const deletedUser = yield prisma.user.delete({
            where: { id },
        });
        return deletedUser || null;
    });
}
function deleteAllUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const deleted = yield prisma.user.deleteMany({});
        return deleted;
    });
}
function getUser(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma.user.findFirst({
            where: { email },
        });
        return user || null;
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
        const updatedUser = yield prisma.user.update({
            where: { id },
            data: {
                email,
                hash,
            },
        });
        return updatedUser || null;
    });
}
