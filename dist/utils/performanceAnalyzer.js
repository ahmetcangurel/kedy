"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePerformance = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path = __importStar(require("path"));
// Import derinliğini hesapla
const calculateImportDepth = (filePath, allFiles, visited = new Set()) => {
    if (visited.has(filePath))
        return 0;
    visited.add(filePath);
    try {
        const content = fs_extra_1.default.readFileSync(filePath, "utf8");
        const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
        if (!importMatches)
            return 0;
        let maxDepth = 0;
        importMatches.forEach((match) => {
            const pathMatch = match.match(/from\s+['"]([^'"]+)['"]/);
            if (pathMatch) {
                const importPath = pathMatch[1];
                // Relative import'ları çöz
                if (importPath.startsWith(".")) {
                    const resolvedPath = path.resolve(path.dirname(filePath), importPath);
                    const targetFile = allFiles.find((f) => f.includes(path.basename(resolvedPath, path.extname(resolvedPath))));
                    if (targetFile && !visited.has(targetFile)) {
                        const depth = calculateImportDepth(targetFile, allFiles, new Set(visited));
                        maxDepth = Math.max(maxDepth, depth + 1);
                    }
                }
            }
        });
        return maxDepth;
    }
    catch (error) {
        return 0;
    }
};
// Bundle size tahmini
const estimateBundleSize = (allFiles) => {
    let totalSize = 0;
    allFiles.forEach((filePath) => {
        try {
            const content = fs_extra_1.default.readFileSync(filePath, "utf8");
            totalSize += content.length;
        }
        catch (error) {
            // Ignore errors
        }
    });
    // Basit tahmin: 1 karakter ≈ 1 byte, gzip compression ≈ %70
    const estimatedSize = totalSize * 0.3; // gzip sonrası tahmini boyut
    let sizeCategory;
    if (estimatedSize < 100 * 1024) {
        // 100KB
        sizeCategory = "small";
    }
    else if (estimatedSize < 500 * 1024) {
        // 500KB
        sizeCategory = "medium";
    }
    else if (estimatedSize < 1024 * 1024) {
        // 1MB
        sizeCategory = "large";
    }
    else {
        sizeCategory = "very-large";
    }
    return { estimatedSize, sizeCategory };
};
// Memory leak pattern'lerini tespit et
const detectMemoryLeaks = (allFiles) => {
    const potentialLeaks = [];
    const useEffectIssues = [];
    const eventListenerIssues = [];
    allFiles.forEach((filePath) => {
        try {
            const content = fs_extra_1.default.readFileSync(filePath, "utf8");
            const relativePath = filePath.replace(process.cwd(), "").substring(1);
            // useEffect dependency array eksikliği
            const useEffectMatches = content.match(/useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]*\}\s*\)/g);
            if (useEffectMatches) {
                useEffectIssues.push(`${relativePath}: Missing dependency array in useEffect`);
            }
            // Event listener cleanup eksikliği
            const addEventListenerMatches = content.match(/addEventListener\s*\([^)]+\)/g);
            const removeEventListenerMatches = content.match(/removeEventListener\s*\([^)]+\)/g);
            if (addEventListenerMatches &&
                (!removeEventListenerMatches ||
                    addEventListenerMatches.length > removeEventListenerMatches.length)) {
                eventListenerIssues.push(`${relativePath}: Missing event listener cleanup`);
            }
            // Interval/Timeout cleanup eksikliği
            const setIntervalMatches = content.match(/setInterval\s*\([^)]+\)/g);
            const clearIntervalMatches = content.match(/clearInterval\s*\([^)]+\)/g);
            if (setIntervalMatches &&
                (!clearIntervalMatches ||
                    setIntervalMatches.length > clearIntervalMatches.length)) {
                potentialLeaks.push(`${relativePath}: Missing interval cleanup`);
            }
            const setTimeoutMatches = content.match(/setTimeout\s*\([^)]+\)/g);
            const clearTimeoutMatches = content.match(/clearTimeout\s*\([^)]+\)/g);
            if (setTimeoutMatches &&
                (!clearTimeoutMatches ||
                    setTimeoutMatches.length > clearTimeoutMatches.length)) {
                potentialLeaks.push(`${relativePath}: Missing timeout cleanup`);
            }
        }
        catch (error) {
            // Ignore errors
        }
    });
    return { potentialLeaks, useEffectIssues, eventListenerIssues };
};
// Döngüsel bağımlılıkları tespit et
const detectCircularDependencies = (allFiles) => {
    const cycles = [];
    const affectedFiles = [];
    // Basit döngüsel bağımlılık tespiti
    allFiles.forEach((filePath) => {
        const visited = new Set();
        const cyclePath = [];
        const dfs = (currentFile) => {
            if (visited.has(currentFile)) {
                const cycleStart = cyclePath.indexOf(currentFile);
                if (cycleStart !== -1) {
                    const cycle = [...cyclePath.slice(cycleStart), currentFile];
                    cycles.push(cycle);
                    cycle.forEach((file) => {
                        if (!affectedFiles.includes(file)) {
                            affectedFiles.push(file);
                        }
                    });
                }
                return;
            }
            visited.add(currentFile);
            cyclePath.push(currentFile);
            try {
                const content = fs_extra_1.default.readFileSync(currentFile, "utf8");
                const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
                if (importMatches) {
                    importMatches.forEach((match) => {
                        const pathMatch = match.match(/from\s+['"]([^'"]+)['"]/);
                        if (pathMatch) {
                            const importPath = pathMatch[1];
                            if (importPath.startsWith(".")) {
                                const resolvedPath = path.resolve(path.dirname(currentFile), importPath);
                                const targetFile = allFiles.find((f) => f.includes(path.basename(resolvedPath, path.extname(resolvedPath))));
                                if (targetFile) {
                                    dfs(targetFile);
                                }
                            }
                        }
                    });
                }
            }
            catch (error) {
                // Ignore errors
            }
            cyclePath.pop();
        };
        dfs(filePath);
    });
    return { cycles, affectedFiles };
};
// Performance analizi yap
const analyzePerformance = (allFiles) => {
    // Bundle size analizi
    const bundleSize = estimateBundleSize(allFiles);
    const bundleSizeRecommendations = [];
    if (bundleSize.sizeCategory === "large" ||
        bundleSize.sizeCategory === "very-large") {
        bundleSizeRecommendations.push("Consider code splitting to reduce bundle size");
        bundleSizeRecommendations.push("Remove unused dependencies");
        bundleSizeRecommendations.push("Use dynamic imports for large components");
    }
    // Import depth analizi
    const depths = [];
    const deepImports = [];
    allFiles.forEach((filePath) => {
        const depth = calculateImportDepth(filePath, allFiles);
        depths.push(depth);
        if (depth > 5) {
            deepImports.push(`${filePath.replace(process.cwd(), "").substring(1)} (depth: ${depth})`);
        }
    });
    const maxDepth = Math.max(...depths);
    const averageDepth = depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
    const importDepthRecommendations = [];
    if (maxDepth > 5) {
        importDepthRecommendations.push("Consider flattening import structure");
        importDepthRecommendations.push("Use barrel exports (index.js files)");
    }
    // Memory leak analizi
    const memoryLeaks = detectMemoryLeaks(allFiles);
    const memoryLeakRecommendations = [];
    if (memoryLeaks.potentialLeaks.length > 0) {
        memoryLeakRecommendations.push("Add cleanup functions for intervals and timeouts");
    }
    if (memoryLeaks.useEffectIssues.length > 0) {
        memoryLeakRecommendations.push("Add dependency arrays to useEffect hooks");
    }
    if (memoryLeaks.eventListenerIssues.length > 0) {
        memoryLeakRecommendations.push("Remove event listeners in cleanup functions");
    }
    // Döngüsel bağımlılık analizi
    const circularDeps = detectCircularDependencies(allFiles);
    const circularDepRecommendations = [];
    if (circularDeps.cycles.length > 0) {
        circularDepRecommendations.push("Refactor to break circular dependencies");
        circularDepRecommendations.push("Consider using dependency injection");
    }
    return {
        bundleSize: {
            estimatedSize: bundleSize.estimatedSize,
            sizeCategory: bundleSize.sizeCategory,
            recommendations: bundleSizeRecommendations,
        },
        importDepth: {
            maxDepth,
            averageDepth: Math.round(averageDepth * 100) / 100,
            deepImports,
            recommendations: importDepthRecommendations,
        },
        memoryLeaks: {
            potentialLeaks: memoryLeaks.potentialLeaks,
            useEffectIssues: memoryLeaks.useEffectIssues,
            eventListenerIssues: memoryLeaks.eventListenerIssues,
            recommendations: memoryLeakRecommendations,
        },
        circularDependencies: {
            cycles: circularDeps.cycles,
            affectedFiles: circularDeps.affectedFiles,
            recommendations: circularDepRecommendations,
        },
    };
};
exports.analyzePerformance = analyzePerformance;
