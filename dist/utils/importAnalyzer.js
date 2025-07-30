"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeProject = exports.findFiles = exports.analyzeFile = exports.checkImportUsage = exports.extractImports = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
// Dosya içeriğinden import'ları çıkar
const extractImports = (content) => {
    const imports = [];
    const lines = content.split("\n");
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        // Default import: import React from 'react'
        const defaultImportMatch = line.match(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
        if (defaultImportMatch) {
            imports.push({
                source: defaultImportMatch[2],
                items: [defaultImportMatch[1]],
                line: lineNumber,
            });
            return;
        }
        // Named imports: import { Text, View } from 'react-native'
        const namedImportMatch = line.match(/import\s*{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
        if (namedImportMatch) {
            const items = namedImportMatch[1]
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
            imports.push({
                source: namedImportMatch[2],
                items,
                line: lineNumber,
            });
            return;
        }
        // Mixed imports: import React, { useState } from 'react'
        const mixedImportMatch = line.match(/import\s+(\w+)\s*,\s*{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
        if (mixedImportMatch) {
            const defaultItem = mixedImportMatch[1];
            const namedItems = mixedImportMatch[2]
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
            imports.push({
                source: mixedImportMatch[3],
                items: [defaultItem, ...namedItems],
                line: lineNumber,
            });
        }
    });
    return imports;
};
exports.extractImports = extractImports;
// Dosya içeriğinde import'ların kullanılıp kullanılmadığını kontrol et
const checkImportUsage = (content, imports) => {
    const used = [];
    const unused = [];
    imports.forEach((importInfo) => {
        const usedItems = [];
        const unusedItems = [];
        importInfo.items.forEach((item) => {
            // Import edilen item'ın dosyada kullanılıp kullanılmadığını kontrol et
            const regex = new RegExp(`\\b${item}\\b`, "g");
            const matches = content.match(regex);
            if (matches && matches.length > 1) {
                // 1'den fazla çünkü import satırı da sayılıyor
                usedItems.push(item);
            }
            else {
                unusedItems.push(item);
            }
        });
        if (usedItems.length > 0) {
            used.push({
                source: importInfo.source,
                items: usedItems,
                line: importInfo.line,
            });
        }
        if (unusedItems.length > 0) {
            unused.push({
                source: importInfo.source,
                items: unusedItems,
                line: importInfo.line,
            });
        }
    });
    return { used, unused };
};
exports.checkImportUsage = checkImportUsage;
// Dosyayı analiz et
const analyzeFile = (filePath) => {
    try {
        const content = fs_extra_1.default.readFileSync(filePath, "utf8");
        const imports = (0, exports.extractImports)(content);
        const { used, unused } = (0, exports.checkImportUsage)(content, imports);
        return {
            filePath,
            imports,
            usedImports: used,
            unusedImports: unused,
        };
    }
    catch (error) {
        logger_1.logger.error(`Error analyzing file ${filePath}: ${error}`);
        return null;
    }
};
exports.analyzeFile = analyzeFile;
// Klasördeki tüm dosyaları bul
const findFiles = (dir, extensions, excludeDirs) => {
    const files = [];
    const scanDirectory = (currentDir) => {
        try {
            const items = fs_extra_1.default.readdirSync(currentDir);
            items.forEach((item) => {
                const fullPath = path_1.default.join(currentDir, item);
                const stat = fs_extra_1.default.statSync(fullPath);
                if (stat.isDirectory()) {
                    // Dışarıda bırakılacak klasörleri kontrol et
                    const shouldExclude = excludeDirs.some((excludeDir) => fullPath.includes(excludeDir) || item === excludeDir);
                    if (!shouldExclude) {
                        scanDirectory(fullPath);
                    }
                }
                else if (stat.isFile()) {
                    // Dosya uzantısını kontrol et
                    const ext = path_1.default.extname(item);
                    if (extensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error(`Error scanning directory ${currentDir}: ${error}`);
        }
    };
    scanDirectory(dir);
    return files;
};
exports.findFiles = findFiles;
// Projeyi analiz et
const analyzeProject = (config) => {
    const { importAnalysis } = config;
    const { fileExtensions, scanFolders, excludeFiles } = importAnalysis;
    let allFiles = [];
    // Belirtilen klasörleri tara
    scanFolders.forEach((folder) => {
        const folderPath = path_1.default.resolve(process.cwd(), folder);
        if (fs_extra_1.default.existsSync(folderPath)) {
            const files = (0, exports.findFiles)(folderPath, fileExtensions, excludeFiles);
            allFiles = [...allFiles, ...files];
        }
    });
    const details = [];
    let totalUnusedImports = 0;
    // Her dosyayı analiz et
    allFiles.forEach((filePath) => {
        const result = (0, exports.analyzeFile)(filePath);
        if (result && result.unusedImports.length > 0) {
            details.push(result);
            totalUnusedImports += result.unusedImports.reduce((sum, imp) => sum + imp.items.length, 0);
        }
    });
    return {
        totalFiles: allFiles.length,
        filesWithIssues: details.length,
        totalUnusedImports,
        details,
    };
};
exports.analyzeProject = analyzeProject;
