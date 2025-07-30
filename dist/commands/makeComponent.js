"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeComponent = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const nanospinner_1 = require("nanospinner");
const configLoader_1 = require("../utils/configLoader");
const fileGenerator_1 = require("../utils/fileGenerator");
const logger_1 = require("../utils/logger");
const makeComponent = (name, options) => {
    var _a, _b;
    const config = (0, configLoader_1.loadConfig)();
    const [folder, screenName] = name.includes(":")
        ? name.split(":")
        : [null, name];
    const basePath = folder
        ? path_1.default.join(config.paths.screens, capitalize(folder))
        : config.paths.screens;
    const screenFileName = config.namingConvention.screen(capitalize(screenName));
    const fullPath = path_1.default.join(basePath, `${screenFileName}.${config.language === "typescript" ? "tsx" : "jsx"}`);
    const spinner = (0, nanospinner_1.createSpinner)(`Creating screen: ${screenFileName}`).start();
    try {
        fs_1.default.mkdirSync(basePath, { recursive: true });
        const templateContent = config.templates.screen
            ? config.templates.screen(screenName)
            : require("../../templates/defaultScreen").default(screenName);
        (0, fileGenerator_1.generateFile)(fullPath, templateContent);
        if ((_a = options.style) !== null && _a !== void 0 ? _a : config.defaults.withStyle) {
            const stylePath = path_1.default.join(basePath, `${config.namingConvention.style(screenName)}.${config.language === "typescript" ? "ts" : "js"}`);
            (0, fileGenerator_1.generateFile)(stylePath, `export const styles = {\n  container: {},\n};\n`);
        }
        if ((_b = options.index) !== null && _b !== void 0 ? _b : config.defaults.withIndex) {
            const indexPath = path_1.default.join(basePath, `index.${config.language === "typescript" ? "ts" : "js"}`);
            (0, fileGenerator_1.generateFile)(indexPath, `export { default } from './${screenFileName}';\n`);
        }
        spinner.success({ text: `Screen ${screenFileName} created successfully!` });
    }
    catch (error) {
        spinner.error({ text: `Failed to create screen: ${error.message}` });
        logger_1.logger.error(error);
    }
};
exports.makeComponent = makeComponent;
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
