"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const loadConfig = () => {
    const configPath = path_1.default.resolve(process.cwd(), "kedy.config.js");
    if (fs_1.default.existsSync(configPath)) {
        return require(configPath);
    }
    return {
        paths: {
            screens: "src/Screens",
            components: "src/Components",
        },
        defaults: {
            withStyle: true,
            withIndex: true,
            withTest: true,
        },
        namingConvention: {
            screen: (name) => `${name}Screen`,
            style: (name) => `${name}Screen.Style`,
        },
        language: "typescript",
        templates: {},
    };
};
exports.loadConfig = loadConfig;
