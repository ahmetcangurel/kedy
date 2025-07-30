"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUnusedFiles = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
// Dosya türünü belirle
const getFileType = (filePath) => {
    const relativePath = filePath.replace(process.cwd(), "").substring(1);
    if (relativePath.includes("/components/"))
        return "component";
    if (relativePath.includes("/screens/"))
        return "screen";
    if (relativePath.includes("/utils/") || relativePath.includes("/helpers/"))
        return "util";
    return "other";
};
// Dosya adından export edilen isimleri tahmin et
const getExportNames = (filePath, content) => {
    const fileName = path_1.default.basename(filePath, path_1.default.extname(filePath));
    const names = [];
    // Default export için dosya adını kullan
    names.push(fileName);
    // Named exports'ları bul
    const exportMatches = content.match(/export\s+(?:const|function|class)\s+(\w+)/g);
    if (exportMatches) {
        exportMatches.forEach((match) => {
            const nameMatch = match.match(/export\s+(?:const|function|class)\s+(\w+)/);
            if (nameMatch) {
                names.push(nameMatch[1]);
            }
        });
    }
    // Export default ile export edilen isimleri bul
    const defaultExportMatches = content.match(/export\s+default\s+(\w+)/g);
    if (defaultExportMatches) {
        defaultExportMatches.forEach((match) => {
            const nameMatch = match.match(/export\s+default\s+(\w+)/);
            if (nameMatch) {
                names.push(nameMatch[1]);
            }
        });
    }
    return [...new Set(names)]; // Duplicate'ları kaldır
};
// Dosyada import/require kullanımını kontrol et
const isFileImported = (filePath, projectFiles) => {
    const fileName = path_1.default.basename(filePath, path_1.default.extname(filePath));
    const relativePath = filePath.replace(process.cwd(), "").substring(1);
    const dirName = path_1.default.dirname(relativePath);
    // Dosya adından oluşturulabilecek import yolları
    const possibleImportPaths = [
        `./${fileName}`,
        `../${fileName}`,
        `../../${fileName}`,
        `../../../${fileName}`,
        `./${fileName}/${fileName}`,
        `../${fileName}/${fileName}`,
        `./${dirName}/${fileName}`,
        `../${dirName}/${fileName}`,
    ];
    // Tüm proje dosyalarını kontrol et
    for (const projectFile of projectFiles) {
        if (projectFile === filePath)
            continue; // Kendisini kontrol etme
        try {
            const content = fs_extra_1.default.readFileSync(projectFile, "utf8");
            // Import/require kullanımını kontrol et
            const importPatterns = [
                // ES6 imports
                new RegExp(`import\\s+.*\\s+from\\s+['"]${fileName}['"]`, "g"),
                new RegExp(`import\\s+.*\\s+from\\s+['"]\\./${fileName}['"]`, "g"),
                new RegExp(`import\\s+.*\\s+from\\s+['"]\\.\\./${fileName}['"]`, "g"),
                new RegExp(`import\\s+.*\\s+from\\s+['"]\\.\\./\\.\\./${fileName}['"]`, "g"),
                // Require statements
                new RegExp(`require\\(['"]${fileName}['"]\\)`, "g"),
                new RegExp(`require\\(['"]\\./${fileName}['"]\\)`, "g"),
                new RegExp(`require\\(['"]\\.\\./${fileName}['"]\\)`, "g"),
                new RegExp(`require\\(['"]\\.\\./\\.\\./${fileName}['"]\\)`, "g"),
                // Relative path imports
                ...possibleImportPaths.map((p) => new RegExp(`import\\s+.*\\s+from\\s+['"]${p}['"]`, "g")),
                ...possibleImportPaths.map((p) => new RegExp(`require\\(['"]${p}['"]\\)`, "g")),
            ];
            // Her pattern'i kontrol et
            for (const pattern of importPatterns) {
                if (pattern.test(content)) {
                    return true; // Dosya kullanılıyor
                }
            }
            // Export edilen isimleri kontrol et
            const exportNames = getExportNames(filePath, fs_extra_1.default.readFileSync(filePath, "utf8"));
            for (const exportName of exportNames) {
                const namePatterns = [
                    new RegExp(`import\\s+.*\\b${exportName}\\b.*\\s+from`, "g"),
                    new RegExp(`import\\s+{\\s*.*\\b${exportName}\\b.*\\s*}\\s+from`, "g"),
                    new RegExp(`const\\s+{\\s*.*\\b${exportName}\\b.*\\s*}\\s*=`, "g"),
                ];
                for (const pattern of namePatterns) {
                    if (pattern.test(content)) {
                        return true; // Export edilen isim kullanılıyor
                    }
                }
            }
        }
        catch (error) {
            // Dosya okunamazsa atla
            continue;
        }
    }
    return false; // Dosya kullanılmıyor
};
// Klasördeki tüm dosyaları bul
const findProjectFiles = (dir, extensions, excludeDirs) => {
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
// Projeyi analiz et
const findUnusedFiles = (config) => {
    const { importAnalysis } = config;
    const { fileExtensions, scanFolders, excludeFiles } = importAnalysis;
    let allFiles = [];
    // Belirtilen klasörleri tara
    scanFolders.forEach((folder) => {
        const folderPath = path_1.default.resolve(process.cwd(), folder);
        if (fs_extra_1.default.existsSync(folderPath)) {
            const files = findProjectFiles(folderPath, fileExtensions, excludeFiles);
            allFiles = [...allFiles, ...files];
        }
    });
    const unusedFiles = [];
    // Her dosyayı kontrol et
    allFiles.forEach((filePath) => {
        try {
            const stat = fs_extra_1.default.statSync(filePath);
            const isImported = isFileImported(filePath, allFiles);
            if (!isImported) {
                unusedFiles.push({
                    filePath,
                    relativePath: filePath.replace(process.cwd(), "").substring(1),
                    size: stat.size,
                    lastModified: stat.mtime,
                    type: getFileType(filePath),
                });
            }
        }
        catch (error) {
            logger_1.logger.error(`Error analyzing file ${filePath}: ${error}`);
        }
    });
    return {
        totalFiles: allFiles.length,
        unusedFiles: unusedFiles.length,
        details: unusedFiles,
    };
};
exports.findUnusedFiles = findUnusedFiles;
