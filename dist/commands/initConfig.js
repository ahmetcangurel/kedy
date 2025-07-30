"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initConfig = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const nanospinner_1 = require("nanospinner");
const logger_1 = require("../utils/logger");
const initConfig = () => {
    const spinner = (0, nanospinner_1.createSpinner)("Initializing kedy configuration...").start();
    try {
        const currentDir = process.cwd();
        // 1. kedy.config.js dosyasını oluştur
        const configTemplatePath = path_1.default.resolve(__dirname, "../../src/kedy-templates/kedy.config.js");
        const configContent = fs_extra_1.default.readFileSync(configTemplatePath, "utf8");
        const configPath = path_1.default.resolve(currentDir, "kedy.config.js");
        if (fs_extra_1.default.existsSync(configPath)) {
            spinner.warn({ text: "kedy.config.js already exists. Skipping..." });
        }
        else {
            fs_extra_1.default.writeFileSync(configPath, configContent, "utf8");
            spinner.success({ text: "kedy.config.js created successfully!" });
        }
        // 2. kedy-templates klasörünü oluştur
        const templatesDir = path_1.default.resolve(currentDir, "kedy-templates");
        if (!fs_extra_1.default.existsSync(templatesDir)) {
            fs_extra_1.default.mkdirSync(templatesDir, { recursive: true });
        }
        // 3. Template dosyalarını kopyala
        const sourceTemplatesDir = path_1.default.resolve(__dirname, "../../src/kedy-templates");
        const targetTemplatesDir = path_1.default.resolve(templatesDir);
        if (!fs_extra_1.default.existsSync(targetTemplatesDir)) {
            fs_extra_1.default.mkdirSync(targetTemplatesDir, { recursive: true });
        }
        // Template dosyalarını kopyala (kedy.config.js hariç)
        const templateFiles = [
            "component.template",
            "screen.template",
            "style.template",
            "test.template",
            "story.template",
        ];
        templateFiles.forEach((file) => {
            const sourcePath = path_1.default.resolve(sourceTemplatesDir, file);
            const targetPath = path_1.default.resolve(targetTemplatesDir, file);
            if (fs_extra_1.default.existsSync(sourcePath)) {
                const content = fs_extra_1.default.readFileSync(sourcePath, "utf8");
                fs_extra_1.default.writeFileSync(targetPath, content, "utf8");
            }
        });
        spinner.success({ text: "Template files created successfully!" });
        // 4. Başarı mesajı
        console.log("\n🎉 Kedy configuration initialized successfully!");
        console.log("📁 Created files:");
        console.log("   - kedy.config.js");
        console.log("   - kedy-templates/");
        console.log("\n🚀 You can now use:");
        console.log("   npx kedy make:screen <name>");
        console.log("   npx kedy make:component <name>");
    }
    catch (error) {
        spinner.error({
            text: `Failed to initialize configuration: ${error.message}`,
        });
        logger_1.logger.error(error);
    }
};
exports.initConfig = initConfig;
