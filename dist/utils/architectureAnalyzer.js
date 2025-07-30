"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeArchitecture = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
// Klasör yapısını analiz et
const analyzeFolderStructure = (projectRoot) => {
    const issues = [];
    const recommendations = [];
    let score = 100;
    const expectedFolders = [
        "src",
        "src/components",
        "src/screens",
        "src/hooks",
        "src/utils",
    ];
    const optionalFolders = [
        "src/services",
        "src/types",
        "src/constants",
        "src/assets",
    ];
    // Temel klasörlerin varlığını kontrol et
    expectedFolders.forEach((folder) => {
        const folderPath = path_1.default.join(projectRoot, folder);
        if (!fs_extra_1.default.existsSync(folderPath)) {
            issues.push(`Missing required folder: ${folder}`);
            score -= 10;
        }
    });
    // Opsiyonel klasörlerin varlığını kontrol et
    optionalFolders.forEach((folder) => {
        const folderPath = path_1.default.join(projectRoot, folder);
        if (fs_extra_1.default.existsSync(folderPath)) {
            score += 5; // Bonus puan
        }
    });
    // Klasör derinliğini kontrol et
    const checkFolderDepth = (dir, currentDepth = 0) => {
        if (currentDepth > 4) {
            issues.push(`Deep folder structure detected: ${dir} (depth: ${currentDepth})`);
            score -= 5;
        }
        try {
            const items = fs_extra_1.default.readdirSync(dir);
            items.forEach((item) => {
                const fullPath = path_1.default.join(dir, item);
                const stat = fs_extra_1.default.statSync(fullPath);
                if (stat.isDirectory() &&
                    !item.startsWith(".") &&
                    item !== "node_modules") {
                    checkFolderDepth(fullPath, currentDepth + 1);
                }
            });
        }
        catch (error) {
            // Ignore errors
        }
    };
    checkFolderDepth(projectRoot);
    // Öneriler
    if (score < 80) {
        recommendations.push("Follow standard React Native folder structure");
        recommendations.push("Keep folder depth under 4 levels");
    }
    return { score: Math.max(0, score), issues, recommendations };
};
// İsimlendirme kurallarını kontrol et
const analyzeNamingConventions = (allFiles) => {
    const violations = [];
    const recommendations = [];
    let score = 100;
    allFiles.forEach((filePath) => {
        const fileName = path_1.default.basename(filePath);
        const relativePath = filePath.replace(process.cwd(), "").substring(1);
        // PascalCase kontrolü (component dosyaları için)
        if (relativePath.includes("/components/") ||
            relativePath.includes("/screens/")) {
            const componentName = path_1.default.basename(fileName, path_1.default.extname(fileName));
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
                violations.push(`${relativePath}: Component should use PascalCase (${componentName})`);
                score -= 5;
            }
        }
        // camelCase kontrolü (hook dosyaları için)
        if (relativePath.includes("/hooks/")) {
            const hookName = path_1.default.basename(fileName, path_1.default.extname(fileName));
            if (!/^use[A-Z][a-zA-Z0-9]*$/.test(hookName)) {
                violations.push(`${relativePath}: Hook should start with 'use' and use PascalCase (${hookName})`);
                score -= 5;
            }
        }
        // camelCase kontrolü (util dosyaları için)
        if (relativePath.includes("/utils/")) {
            const utilName = path_1.default.basename(fileName, path_1.default.extname(fileName));
            if (!/^[a-z][a-zA-Z0-9]*$/.test(utilName)) {
                violations.push(`${relativePath}: Utility should use camelCase (${utilName})`);
                score -= 3;
            }
        }
        // Dosya uzantısı kontrolü
        const ext = path_1.default.extname(fileName);
        if (![".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
            violations.push(`${relativePath}: Use .js, .jsx, .ts, or .tsx extensions`);
            score -= 2;
        }
    });
    // Öneriler
    if (violations.length > 0) {
        recommendations.push("Use PascalCase for components and screens");
        recommendations.push("Use camelCase for utilities and hooks");
        recommendations.push('Hooks should start with "use"');
    }
    return { score: Math.max(0, score), violations, recommendations };
};
// Component hiyerarşisini analiz et
const analyzeComponentHierarchy = (allFiles) => {
    const depths = [];
    const deepComponents = [];
    allFiles.forEach((filePath) => {
        if (filePath.includes("/components/") || filePath.includes("/screens/")) {
            try {
                const content = fs_extra_1.default.readFileSync(filePath, "utf8");
                const relativePath = filePath.replace(process.cwd(), "").substring(1);
                // Component içindeki component kullanımını say
                const componentMatches = content.match(/<[A-Z][a-zA-Z0-9]*/g);
                if (componentMatches) {
                    const depth = componentMatches.length;
                    depths.push(depth);
                    if (depth > 8) {
                        deepComponents.push(`${relativePath} (${depth} components)`);
                    }
                }
            }
            catch (error) {
                // Ignore errors
            }
        }
    });
    const maxDepth = Math.max(...depths, 0);
    const averageDepth = depths.length > 0
        ? depths.reduce((sum, depth) => sum + depth, 0) / depths.length
        : 0;
    const recommendations = [];
    if (maxDepth > 8) {
        recommendations.push("Consider breaking down complex components");
        recommendations.push("Use composition over deep nesting");
    }
    return {
        maxDepth,
        averageDepth: Math.round(averageDepth * 100) / 100,
        deepComponents,
        recommendations,
    };
};
// State management pattern'lerini tespit et
const analyzeStateManagement = (allFiles) => {
    const patterns = [];
    const recommendations = [];
    allFiles.forEach((filePath) => {
        try {
            const content = fs_extra_1.default.readFileSync(filePath, "utf8");
            // Redux pattern'leri
            if (content.includes("useSelector") || content.includes("useDispatch")) {
                if (!patterns.includes("Redux")) {
                    patterns.push("Redux");
                }
            }
            // Context pattern'leri
            if (content.includes("createContext") || content.includes("useContext")) {
                if (!patterns.includes("Context API")) {
                    patterns.push("Context API");
                }
            }
            // Zustand pattern'leri
            if (content.includes("zustand") || content.includes("create(")) {
                if (!patterns.includes("Zustand")) {
                    patterns.push("Zustand");
                }
            }
            // Local state pattern'leri
            if (content.includes("useState") && !content.includes("useContext")) {
                if (!patterns.includes("Local State")) {
                    patterns.push("Local State");
                }
            }
        }
        catch (error) {
            // Ignore errors
        }
    });
    // Öneriler
    if (patterns.length === 0) {
        recommendations.push("Consider implementing a state management solution");
    }
    else if (patterns.length > 2) {
        recommendations.push("Consider consolidating state management patterns");
    }
    if (patterns.includes("Local State") &&
        !patterns.includes("Context API") &&
        !patterns.includes("Redux")) {
        recommendations.push("Consider using Context API for shared state");
    }
    return { patterns, recommendations };
};
// Architecture analizi yap
const analyzeArchitecture = (projectRoot, allFiles) => {
    const folderStructure = analyzeFolderStructure(projectRoot);
    const namingConventions = analyzeNamingConventions(allFiles);
    const componentHierarchy = analyzeComponentHierarchy(allFiles);
    const stateManagement = analyzeStateManagement(allFiles);
    return {
        folderStructure,
        namingConventions,
        componentHierarchy,
        stateManagement,
    };
};
exports.analyzeArchitecture = analyzeArchitecture;
