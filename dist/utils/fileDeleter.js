"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteByPattern = exports.deleteMultipleFiles = exports.deleteFileOrFolder = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
// Dosya türünü belirle
const getFileType = (filePath) => {
    const relativePath = filePath.replace(process.cwd(), "").substring(1);
    if (relativePath.includes("/screens/"))
        return "screen";
    if (relativePath.includes("/components/"))
        return "component";
    return "other";
};
// Dosya ve klasör boyutunu hesapla
const calculateSize = (filePath) => {
    try {
        const stat = fs_extra_1.default.statSync(filePath);
        if (stat.isFile()) {
            return stat.size;
        }
        else if (stat.isDirectory()) {
            let totalSize = 0;
            const items = fs_extra_1.default.readdirSync(filePath);
            items.forEach((item) => {
                const fullPath = path_1.default.join(filePath, item);
                totalSize += calculateSize(fullPath);
            });
            return totalSize;
        }
    }
    catch (error) {
        logger_1.logger.error(`Error calculating size for ${filePath}: ${error}`);
    }
    return 0;
};
// Dosyayı yedekle
const backupFile = (filePath) => {
    try {
        const backupPath = `${filePath}.backup`;
        fs_extra_1.default.copyFileSync(filePath, backupPath);
        return backupPath;
    }
    catch (error) {
        logger_1.logger.error(`Error backing up ${filePath}: ${error}`);
        return null;
    }
};
// Dosyayı sil
const deleteFile = (filePath, options) => {
    try {
        if (options.backup) {
            backupFile(filePath);
        }
        fs_extra_1.default.unlinkSync(filePath);
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
};
// Klasörü sil
const deleteFolder = (folderPath, options) => {
    try {
        if (options.backup) {
            // Klasör içindeki tüm dosyaları yedekle
            const backupFolder = (currentPath) => {
                const items = fs_extra_1.default.readdirSync(currentPath);
                items.forEach((item) => {
                    const fullPath = path_1.default.join(currentPath, item);
                    const stat = fs_extra_1.default.statSync(fullPath);
                    if (stat.isFile()) {
                        backupFile(fullPath);
                    }
                    else if (stat.isDirectory()) {
                        backupFolder(fullPath);
                    }
                });
            };
            backupFolder(folderPath);
        }
        if (options.recursive) {
            fs_extra_1.default.rmSync(folderPath, { recursive: true, force: options.force || false });
        }
        else {
            fs_extra_1.default.rmdirSync(folderPath);
        }
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
};
// Dosya veya klasörü sil
const deleteFileOrFolder = (targetPath, options = {}) => {
    const result = {
        success: false,
        deletedFiles: [],
        deletedFolders: [],
        errors: [],
        totalSize: 0,
    };
    try {
        const fullPath = path_1.default.resolve(process.cwd(), targetPath);
        if (!fs_extra_1.default.existsSync(fullPath)) {
            result.errors.push(`Path does not exist: ${targetPath}`);
            return result;
        }
        const stat = fs_extra_1.default.statSync(fullPath);
        const fileType = getFileType(fullPath);
        const size = calculateSize(fullPath);
        // Onay mesajı
        const typeText = fileType === "screen"
            ? "Screen"
            : fileType === "component"
                ? "Component"
                : "File";
        const sizeKB = (size / 1024).toFixed(2);
        logger_1.logger.info(`🗑️  Deleting ${typeText}: ${targetPath} (${sizeKB} KB)`);
        if (stat.isFile()) {
            const deleteResult = deleteFile(fullPath, options);
            if (deleteResult.success) {
                result.deletedFiles.push(targetPath);
                result.totalSize += size;
            }
            else {
                result.errors.push(`Failed to delete file ${targetPath}: ${deleteResult.error}`);
            }
        }
        else if (stat.isDirectory()) {
            const deleteResult = deleteFolder(fullPath, options);
            if (deleteResult.success) {
                result.deletedFolders.push(targetPath);
                result.totalSize += size;
            }
            else {
                result.errors.push(`Failed to delete folder ${targetPath}: ${deleteResult.error}`);
            }
        }
        result.success = result.errors.length === 0;
    }
    catch (error) {
        result.errors.push(`Unexpected error: ${error.message}`);
    }
    return result;
};
exports.deleteFileOrFolder = deleteFileOrFolder;
// Birden fazla dosyayı sil
const deleteMultipleFiles = (filePaths, options = {}) => {
    const result = {
        success: false,
        deletedFiles: [],
        deletedFolders: [],
        errors: [],
        totalSize: 0,
    };
    filePaths.forEach((filePath) => {
        const deleteResult = (0, exports.deleteFileOrFolder)(filePath, options);
        result.deletedFiles.push(...deleteResult.deletedFiles);
        result.deletedFolders.push(...deleteResult.deletedFolders);
        result.errors.push(...deleteResult.errors);
        result.totalSize += deleteResult.totalSize;
    });
    result.success = result.errors.length === 0;
    return result;
};
exports.deleteMultipleFiles = deleteMultipleFiles;
// Pattern'e göre dosyaları bul ve sil
const deleteByPattern = (pattern, options = {}) => {
    const result = {
        success: false,
        deletedFiles: [],
        deletedFolders: [],
        errors: [],
        totalSize: 0,
    };
    try {
        // Basit pattern matching
        const searchPattern = pattern.replace(/\*/g, ".*");
        const regex = new RegExp(searchPattern, "i");
        const findFiles = (dir) => {
            const files = [];
            try {
                const items = fs_extra_1.default.readdirSync(dir);
                items.forEach((item) => {
                    const fullPath = path_1.default.join(dir, item);
                    const relativePath = fullPath.replace(process.cwd(), "").substring(1);
                    if (regex.test(relativePath)) {
                        files.push(relativePath);
                    }
                    const stat = fs_extra_1.default.statSync(fullPath);
                    if (stat.isDirectory()) {
                        files.push(...findFiles(fullPath));
                    }
                });
            }
            catch (error) {
                logger_1.logger.error(`Error searching in ${dir}: ${error}`);
            }
            return files;
        };
        const matchingFiles = findFiles(process.cwd());
        if (matchingFiles.length === 0) {
            result.errors.push(`No files found matching pattern: ${pattern}`);
            return result;
        }
        logger_1.logger.info(`Found ${matchingFiles.length} files matching pattern: ${pattern}`);
        // Sadece klasörleri sil, dosyaları değil
        const foldersToDelete = matchingFiles.filter((file) => {
            const fullPath = path_1.default.resolve(process.cwd(), file);
            return fs_extra_1.default.statSync(fullPath).isDirectory();
        });
        return (0, exports.deleteMultipleFiles)(foldersToDelete, options);
    }
    catch (error) {
        result.errors.push(`Error with pattern matching: ${error.message}`);
    }
    return result;
};
exports.deleteByPattern = deleteByPattern;
