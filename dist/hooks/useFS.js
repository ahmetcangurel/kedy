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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewFile = exports.createNewDirectory = void 0;
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const createNewDirectory = (name) => __awaiter(void 0, void 0, void 0, function* () {
    if (fs_1.default.existsSync(name)) {
        logger_1.logger.error("Directory already exists:" + name);
    }
    else {
        fs_1.default.mkdirSync(name);
    }
});
exports.createNewDirectory = createNewDirectory;
const createNewFile = (name, content) => __awaiter(void 0, void 0, void 0, function* () {
    if (fs_1.default.existsSync(name)) {
        logger_1.logger.error("File already exists:" + name);
    }
    else {
        fs_1.default.writeFileSync(name, content);
    }
});
exports.createNewFile = createNewFile;
