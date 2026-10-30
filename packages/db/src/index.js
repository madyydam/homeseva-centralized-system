"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIsolatedBusinessDb = exports.IsolatedBusinessDatabase = exports.PrismaClient = exports.prisma = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return client_1.prisma; } });
var client_2 = require("../generated/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_2.PrismaClient; } });
var tenant_1 = require("./tenant");
Object.defineProperty(exports, "IsolatedBusinessDatabase", { enumerable: true, get: function () { return tenant_1.IsolatedBusinessDatabase; } });
Object.defineProperty(exports, "getIsolatedBusinessDb", { enumerable: true, get: function () { return tenant_1.getIsolatedBusinessDb; } });
//# sourceMappingURL=index.js.map