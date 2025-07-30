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
exports.analyzeProject = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
const architectureAnalyzer_1 = require("./architectureAnalyzer");
const testingAnalyzer_1 = require("./testingAnalyzer");
const securityAnalyzer_1 = require("./securityAnalyzer");
// Dosya türünü belirle
const getFileType = (filePath) => {
    const relativePath = filePath.replace(process.cwd(), "").substring(1);
    if (relativePath.includes("/screens/"))
        return "screen";
    if (relativePath.includes("/components/"))
        return "component";
    if (relativePath.includes("/hooks/"))
        return "hook";
    if (relativePath.includes("/utils/") || relativePath.includes("/helpers/"))
        return "util";
    return "other";
};
// Dosya satır sayısını hesapla
const countLines = (content) => {
    return content.split("\n").length;
};
// Kod karmaşıklığını hesapla (basit versiyon)
const calculateComplexity = (content) => {
    let complexity = 1;
    // Conditional statements
    complexity += (content.match(/if\s*\(/g) || []).length;
    complexity += (content.match(/else\s*if\s*\(/g) || []).length;
    complexity += (content.match(/switch\s*\(/g) || []).length;
    complexity += (content.match(/case\s+/g) || []).length;
    // Loops
    complexity += (content.match(/for\s*\(/g) || []).length;
    complexity += (content.match(/while\s*\(/g) || []).length;
    complexity += (content.match(/forEach\s*\(/g) || []).length;
    complexity += (content.match(/map\s*\(/g) || []).length;
    // Functions
    complexity += (content.match(/function\s+\w+/g) || []).length;
    complexity += (content.match(/const\s+\w+\s*=\s*\(/g) || []).length;
    complexity += (content.match(/=>\s*{/g) || []).length;
    return complexity;
};
// Import'ları çıkar
const extractImports = (content) => {
    const imports = [];
    // ES6 imports
    const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
        importMatches.forEach((match) => {
            const pathMatch = match.match(/from\s+['"]([^'"]+)['"]/);
            if (pathMatch) {
                imports.push(pathMatch[1]);
            }
        });
    }
    // Require statements
    const requireMatches = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
    if (requireMatches) {
        requireMatches.forEach((match) => {
            const pathMatch = match.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
            if (pathMatch) {
                imports.push(pathMatch[1]);
            }
        });
    }
    return imports;
};
// Export'ları çıkar
const extractExports = (content) => {
    const exports = [];
    // Named exports
    const exportMatches = content.match(/export\s+(?:const|function|class)\s+(\w+)/g);
    if (exportMatches) {
        exportMatches.forEach((match) => {
            const nameMatch = match.match(/export\s+(?:const|function|class)\s+(\w+)/);
            if (nameMatch) {
                exports.push(nameMatch[1]);
            }
        });
    }
    // Default exports
    const defaultExportMatches = content.match(/export\s+default\s+(\w+)/g);
    if (defaultExportMatches) {
        defaultExportMatches.forEach((match) => {
            const nameMatch = match.match(/export\s+default\s+(\w+)/);
            if (nameMatch) {
                exports.push(nameMatch[1]);
            }
        });
    }
    return exports;
};
// Dosyayı analiz et
const analyzeFile = (filePath) => {
    try {
        const content = fs_extra_1.default.readFileSync(filePath, "utf8");
        const stat = fs_extra_1.default.statSync(filePath);
        return {
            path: filePath,
            relativePath: filePath.replace(process.cwd(), "").substring(1),
            size: stat.size,
            lines: countLines(content),
            type: getFileType(filePath),
            imports: extractImports(content),
            exports: extractExports(content),
            complexity: calculateComplexity(content),
            lastModified: stat.mtime,
        };
    }
    catch (error) {
        logger_1.logger.error(`Error analyzing file ${filePath}: ${error}`);
        return null;
    }
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
                    const shouldExclude = excludeDirs.some((excludeDir) => fullPath.includes(excludeDir) || item === excludeDir);
                    if (!shouldExclude) {
                        scanDirectory(fullPath);
                    }
                }
                else if (stat.isFile()) {
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
// Kullanılmayan dosyaları bul
const findUnusedFiles = (allFiles) => {
    const unusedFiles = [];
    allFiles.forEach((file) => {
        const isUsed = allFiles.some((otherFile) => {
            if (otherFile.path === file.path)
                return false;
            return otherFile.imports.some((importPath) => {
                const fileName = path_1.default.basename(file.path, path_1.default.extname(file.path));
                return importPath.includes(fileName);
            });
        });
        if (!isUsed) {
            unusedFiles.push(file.relativePath);
        }
    });
    return unusedFiles;
};
// Optimizasyon skorunu hesapla
// Önerileri oluştur
const generateRecommendations = (stats) => {
    const recommendations = [];
    if (stats.unusedFiles.length > 0) {
        recommendations.push(`Remove ${stats.unusedFiles.length} unused files to clean up the codebase`);
    }
    const highComplexityFiles = stats.components.filter((f) => f.complexity > 10);
    if (highComplexityFiles.length > 0) {
        recommendations.push(`Consider refactoring ${highComplexityFiles.length} high-complexity components`);
    }
    const largeScreens = stats.screens.filter((f) => f.lines > 200);
    if (largeScreens.length > 0) {
        recommendations.push(`Split ${largeScreens.length} large screens into smaller components`);
    }
    const reusableComponents = stats.components.filter((f) => stats.components.some((other) => other.path !== f.path &&
        other.imports.some((imp) => {
            const fileName = path_1.default.basename(f.path, path_1.default.extname(f.path));
            return imp.includes(fileName);
        })));
    if (reusableComponents.length < stats.components.length * 0.3) {
        recommendations.push("Increase component reusability by extracting common patterns");
    }
    return recommendations;
};
// Projeyi analiz et
const analyzeProject = (config_1, ...args_1) => __awaiter(void 0, [config_1, ...args_1], void 0, function* (config, options = {}) {
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
    // Dosyaları analiz et
    const fileInfos = allFiles
        .map(analyzeFile)
        .filter((file) => file !== null);
    // Kategorilere ayır
    const screens = fileInfos.filter((f) => f.type === "screen");
    const components = fileInfos.filter((f) => f.type === "component");
    const hooks = fileInfos.filter((f) => f.type === "hook");
    const utils = fileInfos.filter((f) => f.type === "util");
    const others = fileInfos.filter((f) => f.type === "other");
    // İstatistikleri hesapla
    const totalFiles = fileInfos.length;
    const totalLines = fileInfos.reduce((sum, f) => sum + f.lines, 0);
    const totalSize = fileInfos.reduce((sum, f) => sum + f.size, 0);
    // Kullanılmayan dosyaları bul
    const unusedFiles = findUnusedFiles(fileInfos);
    // Önerileri oluştur
    const recommendations = generateRecommendations({
        totalFiles,
        totalLines,
        totalSize,
        screens,
        components,
        hooks,
        utils,
        others,
        unusedFiles,
        recommendations: [],
    });
    // Analiz modüllerini çalıştır
    let architecture;
    let testing;
    let security;
    if (options.all || options.architecture) {
        architecture = (0, architectureAnalyzer_1.analyzeArchitecture)(process.cwd(), allFiles);
    }
    if (options.all || options.testing) {
        testing = (0, testingAnalyzer_1.analyzeTesting)(allFiles);
    }
    if (options.all || options.security) {
        security = yield (0, securityAnalyzer_1.analyzeSecurity)(process.cwd(), allFiles);
    }
    return {
        totalFiles,
        totalLines,
        totalSize,
        screens,
        components,
        hooks,
        utils,
        others,
        unusedFiles,
        recommendations,
        architecture,
        testing,
        security,
    };
});
exports.analyzeProject = analyzeProject;
