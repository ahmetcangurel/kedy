"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUnused = void 0;
const nanospinner_1 = require("nanospinner");
const configLoader_1 = require("../utils/configLoader");
const logger_1 = require("../utils/logger");
const unusedFileAnalyzer_1 = require("../utils/unusedFileAnalyzer");
const findUnused = (options) => {
    const spinner = (0, nanospinner_1.createSpinner)("Finding unused files...").start();
    try {
        const config = (0, configLoader_1.loadConfig)();
        // Analiz yap
        const result = (0, unusedFileAnalyzer_1.findUnusedFiles)(config);
        if (result.unusedFiles === 0) {
            spinner.success({ text: "🎉 No unused files found!" });
            return;
        }
        // Özet rapor
        console.log("\n📊 Unused Files Summary:");
        console.log(`📁 Total files scanned: ${result.totalFiles}`);
        console.log(`🗑️  Unused files found: ${result.unusedFiles}`);
        // Dosya türlerine göre grupla
        const groupedByType = result.details.reduce((acc, file) => {
            if (!acc[file.type]) {
                acc[file.type] = [];
            }
            acc[file.type].push(file);
            return acc;
        }, {});
        // Detaylı rapor
        if (options.detailed) {
            console.log("\n🔍 Detailed Report:");
            Object.entries(groupedByType).forEach(([type, files]) => {
                console.log(`\n📂 ${type.toUpperCase()} (${files.length} files):`);
                files.forEach((file) => {
                    const sizeKB = (file.size / 1024).toFixed(2);
                    const date = file.lastModified.toLocaleDateString();
                    console.log(`   📄 ${file.relativePath} (${sizeKB} KB, ${date})`);
                });
            });
        }
        else {
            // Basit rapor
            console.log("\n📄 Unused Files:");
            result.details.forEach((file) => {
                const sizeKB = (file.size / 1024).toFixed(2);
                console.log(`   📄 ${file.relativePath} (${sizeKB} KB)`);
            });
        }
        // Toplam boyut hesapla
        const totalSize = result.details.reduce((sum, file) => sum + file.size, 0);
        const totalSizeKB = (totalSize / 1024).toFixed(2);
        console.log(`\n💾 Total unused size: ${totalSizeKB} KB`);
        // Silme seçeneği
        if (options.delete) {
            console.log("\n🗑️  Deleting unused files...");
            let deletedCount = 0;
            result.details.forEach((file) => {
                try {
                    const fs = require("fs");
                    fs.unlinkSync(file.filePath);
                    console.log(`   ✅ Deleted: ${file.relativePath}`);
                    deletedCount++;
                }
                catch (error) {
                    console.log(`   ❌ Failed to delete: ${file.relativePath}`);
                }
            });
            console.log(`\n✅ Deleted ${deletedCount} files`);
        }
        else {
            console.log("\n💡 To delete unused files, run: kedy find:unused --delete");
        }
        spinner.success({ text: "Unused files analysis completed!" });
    }
    catch (error) {
        spinner.error({ text: `Failed to find unused files: ${error.message}` });
        logger_1.logger.error(error);
    }
};
exports.findUnused = findUnused;
