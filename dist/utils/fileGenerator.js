"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTemplate = exports.generateFile = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
const generateFile = (filePath, content) => {
    if (fs_extra_1.default.existsSync(filePath)) {
        return logger_1.logger.error(`File already exists: ${filePath}`);
    }
    return fs_extra_1.default.writeFileSync(filePath, content, "utf8");
};
exports.generateFile = generateFile;
const processTemplate = (templatePath, name) => {
    try {
        const fullPath = path_1.default.resolve(process.cwd(), templatePath);
        if (!fs_extra_1.default.existsSync(fullPath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }
        let content = fs_extra_1.default.readFileSync(fullPath, "utf8");
        // Template değişkenlerini değiştir
        content = content.replace(/\{\{name\}\}/g, name);
        content = content.replace(/\{\{Name\}\}/g, name.charAt(0).toUpperCase() + name.slice(1));
        return content;
    }
    catch (error) {
        logger_1.logger.error(`Error processing template: ${error.message}`);
        throw error;
    }
};
exports.processTemplate = processTemplate;
