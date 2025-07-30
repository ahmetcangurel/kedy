"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeReactNative = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
// Platform-specific kod analizi
const analyzePlatformSpecific = (allFiles) => {
    const iosCode = [];
    const androidCode = [];
    const recommendations = [];
    allFiles.forEach((filePath) => {
        try {
            const content = fs_extra_1.default.readFileSync(filePath, "utf8");
            const relativePath = filePath.replace(process.cwd(), "").substring(1);
            // iOS-specific kod tespiti
            const iosPatterns = [
                /Platform\.OS\s*===\s*['"`]ios['"`]/gi,
                /Platform\.select\s*\(\s*\{[^}]*ios[^}]*\}/gi,
                /\.ios\./gi,
                /iOS/gi,
            ];
            iosPatterns.forEach((pattern) => {
                const matches = content.match(pattern);
                if (matches) {
                    iosCode.push(`${relativePath}: ${matches[0].trim()}`);
                }
            });
            // Android-specific kod tespiti
            const androidPatterns = [
                /Platform\.OS\s*===\s*['"`]android['"`]/gi,
                /Platform\.select\s*\(\s*\{[^}]*android[^}]*\}/gi,
                /\.android\./gi,
                /Android/gi,
            ];
            androidPatterns.forEach((pattern) => {
                const matches = content.match(pattern);
                if (matches) {
                    androidCode.push(`${relativePath}: ${matches[0].trim()}`);
                }
            });
        }
        catch (error) {
            // Ignore errors
        }
    });
    // Öneriler
    if (iosCode.length > 0 || androidCode.length > 0) {
        recommendations.push("Consider using Platform.select for better cross-platform compatibility");
        recommendations.push("Extract platform-specific code into separate files");
    }
    return { iosCode, androidCode, recommendations };
};
// Native modül kullanımı analizi
const analyzeNativeModules = (allFiles) => {
    const usedModules = [];
    const performanceIssues = [];
    const recommendations = [];
    const nativeModules = [
        "react-native-camera",
        "react-native-maps",
        "react-native-video",
        "react-native-sound",
        "react-native-fs",
        "react-native-sqlite-storage",
        "react-native-vector-icons",
        "react-native-gesture-handler",
        "react-native-reanimated",
        "react-native-svg",
    ];
    allFiles.forEach((filePath) => {
        try {
            const content = fs_extra_1.default.readFileSync(filePath, "utf8");
            const relativePath = filePath.replace(process.cwd(), "").substring(1);
            nativeModules.forEach((module) => {
                if (content.includes(module)) {
                    if (!usedModules.includes(module)) {
                        usedModules.push(module);
                    }
                    // Performance issue kontrolü
                    if ([
                        "react-native-camera",
                        "react-native-video",
                        "react-native-maps",
                    ].includes(module)) {
                        performanceIssues.push(`${relativePath}: Heavy native module ${module} detected`);
                    }
                }
            });
            // Bridge call analizi
            const bridgePatterns = [
                /NativeModules\.[A-Za-z]+/gi,
                /requireNativeComponent\s*\(/gi,
                /createNativeComponent\s*\(/gi,
            ];
            bridgePatterns.forEach((pattern) => {
                const matches = content.match(pattern);
                if (matches) {
                    performanceIssues.push(`${relativePath}: Native bridge calls detected`);
                }
            });
        }
        catch (error) {
            // Ignore errors
        }
    });
    // Öneriler
    if (performanceIssues.length > 0) {
        recommendations.push("Consider lazy loading heavy native modules");
        recommendations.push("Use native modules only when necessary");
    }
    return { usedModules, performanceIssues, recommendations };
};
// Performance analizi
const analyzePerformance = (allFiles) => {
    const flatListIssues = [];
    const imageOptimization = [];
    const memoryIssues = [];
    const recommendations = [];
    allFiles.forEach((filePath) => {
        try {
            const content = fs_extra_1.default.readFileSync(filePath, "utf8");
            const relativePath = filePath.replace(process.cwd(), "").substring(1);
            // FlatList optimizasyon kontrolü
            if (content.includes("FlatList")) {
                const hasKeyExtractor = content.includes("keyExtractor");
                const hasGetItemLayout = content.includes("getItemLayout");
                const hasRemoveClippedSubviews = content.includes("removeClippedSubviews");
                const hasInitialNumToRender = content.includes("initialNumToRender");
                if (!hasKeyExtractor) {
                    flatListIssues.push(`${relativePath}: Missing keyExtractor in FlatList`);
                }
                if (!hasRemoveClippedSubviews) {
                    flatListIssues.push(`${relativePath}: Consider using removeClippedSubviews for better performance`);
                }
                if (!hasInitialNumToRender) {
                    flatListIssues.push(`${relativePath}: Consider setting initialNumToRender for FlatList`);
                }
            }
            // Image optimizasyon kontrolü
            if (content.includes("Image") || content.includes("FastImage")) {
                const hasResizeMode = content.includes("resizeMode");
                const hasLoadingIndicator = content.includes("loadingIndicatorSource") ||
                    content.includes("ActivityIndicator");
                const hasErrorHandling = content.includes("onError") || content.includes("defaultSource");
                if (!hasResizeMode) {
                    imageOptimization.push(`${relativePath}: Missing resizeMode for Image`);
                }
                if (!hasLoadingIndicator) {
                    imageOptimization.push(`${relativePath}: Consider adding loading indicator for images`);
                }
                if (!hasErrorHandling) {
                    imageOptimization.push(`${relativePath}: Consider adding error handling for images`);
                }
            }
            // Memory leak kontrolü
            const memoryPatterns = [
                /setInterval\s*\([^)]*\)/gi,
                /setTimeout\s*\([^)]*\)/gi,
                /addEventListener\s*\([^)]*\)/gi,
            ];
            memoryPatterns.forEach((pattern) => {
                const matches = content.match(pattern);
                if (matches) {
                    const hasCleanup = content.includes("clearInterval") ||
                        content.includes("clearTimeout") ||
                        content.includes("removeEventListener");
                    if (!hasCleanup) {
                        memoryIssues.push(`${relativePath}: Potential memory leak - missing cleanup`);
                    }
                }
            });
        }
        catch (error) {
            // Ignore errors
        }
    });
    // Öneriler
    if (flatListIssues.length > 0) {
        recommendations.push("Implement FlatList best practices for better performance");
        recommendations.push("Use keyExtractor and removeClippedSubviews");
    }
    if (imageOptimization.length > 0) {
        recommendations.push("Optimize images with proper resizeMode and loading states");
        recommendations.push("Consider using FastImage for better performance");
    }
    if (memoryIssues.length > 0) {
        recommendations.push("Add proper cleanup for intervals, timeouts, and event listeners");
    }
    return { flatListIssues, imageOptimization, memoryIssues, recommendations };
};
// Navigation analizi
const analyzeNavigation = (allFiles) => {
    const patterns = [];
    const issues = [];
    const recommendations = [];
    allFiles.forEach((filePath) => {
        try {
            const content = fs_extra_1.default.readFileSync(filePath, "utf8");
            const relativePath = filePath.replace(process.cwd(), "").substring(1);
            // Navigation pattern'lerini tespit et
            if (content.includes("@react-navigation/native")) {
                if (!patterns.includes("React Navigation")) {
                    patterns.push("React Navigation");
                }
            }
            if (content.includes("useNavigation")) {
                if (!patterns.includes("useNavigation Hook")) {
                    patterns.push("useNavigation Hook");
                }
            }
            if (content.includes("useRoute")) {
                if (!patterns.includes("useRoute Hook")) {
                    patterns.push("useRoute Hook");
                }
            }
            if (content.includes("navigation.navigate")) {
                if (!patterns.includes("Navigation Methods")) {
                    patterns.push("Navigation Methods");
                }
            }
            // Navigation issue'larını tespit et
            const navigationPatterns = [
                /navigation\.navigate\s*\([^)]*\)/gi,
                /navigation\.push\s*\([^)]*\)/gi,
            ];
            navigationPatterns.forEach((pattern) => {
                const matches = content.match(pattern);
                if (matches) {
                    // Hardcoded route name kontrolü
                    const hardcodedRoutes = matches.filter((match) => match.includes("'") || match.includes('"'));
                    if (hardcodedRoutes.length > 0) {
                        issues.push(`${relativePath}: Hardcoded route names detected`);
                    }
                }
            });
            // Deep linking kontrolü
            if (content.includes("linking") || content.includes("DeepLinking")) {
                if (!patterns.includes("Deep Linking")) {
                    patterns.push("Deep Linking");
                }
            }
        }
        catch (error) {
            // Ignore errors
        }
    });
    // Öneriler
    if (patterns.length === 0) {
        recommendations.push("Consider implementing a navigation solution like React Navigation");
    }
    if (issues.length > 0) {
        recommendations.push("Use route constants instead of hardcoded route names");
        recommendations.push("Implement proper navigation type safety");
    }
    return { patterns, issues, recommendations };
};
// React Native analizi yap
const analyzeReactNative = (allFiles) => {
    const platformSpecific = analyzePlatformSpecific(allFiles);
    const nativeModules = analyzeNativeModules(allFiles);
    const performance = analyzePerformance(allFiles);
    const navigation = analyzeNavigation(allFiles);
    return {
        platformSpecific,
        nativeModules,
        performance,
        navigation,
    };
};
exports.analyzeReactNative = analyzeReactNative;
