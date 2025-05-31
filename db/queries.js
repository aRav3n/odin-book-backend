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
exports.addUser = addUser;
const client_1 = require("@prisma/client");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
require("dotenv");
const databaseUrl = process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
    // need to fix this line after Emmet paste to add dollar sign before extends
}).$extends((0, extension_accelerate_1.withAccelerate)());
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
