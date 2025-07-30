"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComponent = void 0;
const nanospinner_1 = require("nanospinner");
const configLoader_1 = require("../utils/configLoader");
const logger_1 = require("../utils/logger");
const fileDeleter_1 = require("../utils/fileDeleter");
const deleteComponent = (componentName, options) => {
    const spinner = (0, nanospinner_1.createSpinner)("Deleting component...").start();
    try {
        const config = (0, configLoader_1.loadConfig)();
        const { components } = config.paths;
        let targetPath;
        let deleteOptions = {
            force: options.force,
            backup: options.backup,
            recursive: options.recursive || true,
        };
        if (options.pattern) {
            // Pattern-based deletion
            const pattern = componentName;
            const result = (0, fileDeleter_1.deleteByPattern)(pattern, deleteOptions);
            if (result.success) {
                spinner.success({ text: "Components deleted successfully!" });
                console.log("\n📊 Deletion Summary:");
                console.log(`🗑️  Deleted files: ${result.deletedFiles.length}`);
                console.log(`📁 Deleted folders: ${result.deletedFolders.length}`);
                console.log(`💾 Total size freed: ${(result.totalSize / 1024).toFixed(2)} KB`);
                if (result.deletedFiles.length > 0) {
                    console.log("\n📄 Deleted Files:");
                    result.deletedFiles.forEach((file) => {
                        console.log(`   ✅ ${file}`);
                    });
                }
                if (result.deletedFolders.length > 0) {
                    console.log("\n📁 Deleted Folders:");
                    result.deletedFolders.forEach((folder) => {
                        console.log(`   ✅ ${folder}`);
                    });
                }
            }
            else {
                spinner.error({ text: "Failed to delete components" });
                console.log("\n❌ Errors:");
                result.errors.forEach((error) => {
                    console.log(`   ${error}`);
                });
            }
            return;
        }
        // Normal component deletion
        if (componentName.includes("/") || componentName.includes(":")) {
            // Parse nested path (e.g., "ui/Modal" -> "Ui/Modal" or "ui:Modal" -> "Ui/Modal")
            const separator = componentName.includes("/") ? "/" : ":";
            const pathParts = componentName.split(separator);
            const capitalizedParts = pathParts.map(part => part.charAt(0).toUpperCase() + part.slice(1));
            targetPath = `${components}/${capitalizedParts.join("/")}`;
        }
        else {
            // Just component name, construct path
            targetPath = `${components}/${componentName}`;
        }
        const result = (0, fileDeleter_1.deleteFileOrFolder)(targetPath, deleteOptions);
        if (result.success) {
            spinner.success({ text: "Component deleted successfully!" });
            console.log("\n📊 Deletion Summary:");
            console.log(`🗑️  Deleted files: ${result.deletedFiles.length}`);
            console.log(`📁 Deleted folders: ${result.deletedFolders.length}`);
            console.log(`💾 Total size freed: ${(result.totalSize / 1024).toFixed(2)} KB`);
            if (result.deletedFiles.length > 0) {
                console.log("\n📄 Deleted Files:");
                result.deletedFiles.forEach((file) => {
                    console.log(`   ✅ ${file}`);
                });
            }
            if (result.deletedFolders.length > 0) {
                console.log("\n📁 Deleted Folders:");
                result.deletedFolders.forEach((folder) => {
                    console.log(`   ✅ ${folder}`);
                });
            }
        }
        else {
            spinner.error({ text: "Failed to delete component" });
            console.log("\n❌ Errors:");
            result.errors.forEach((error) => {
                console.log(`   ${error}`);
            });
        }
    }
    catch (error) {
        spinner.error({ text: `Failed to delete component: ${error.message}` });
        logger_1.logger.error(error);
    }
};
exports.deleteComponent = deleteComponent;
