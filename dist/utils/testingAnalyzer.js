"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTesting = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
// Test coverage analizi
const analyzeTestCoverage = (allFiles) => {
    const testableFiles = allFiles.filter((file) => file.includes("/components/") ||
        file.includes("/screens/") ||
        file.includes("/hooks/") ||
        file.includes("/utils/"));
    const testFiles = allFiles.filter((file) => file.includes(".test.") ||
        file.includes(".spec.") ||
        file.includes("__tests__/"));
    const missingTests = [];
    testableFiles.forEach((file) => {
        const fileName = path_1.default.basename(file, path_1.default.extname(file));
        const fileDir = path_1.default.dirname(file);
        const relativePath = file.replace(process.cwd(), "").substring(1);
        // Test dosyası var mı kontrol et
        const hasTest = testFiles.some((testFile) => {
            const testFileName = path_1.default.basename(testFile, path_1.default.extname(testFile));
            const testFileDir = path_1.default.dirname(testFile);
            return (testFileName.includes(fileName) ||
                testFileName.includes(fileName.replace(".jsx", "").replace(".tsx", "")) ||
                testFile.includes(`__tests__/${fileName}`));
        });
        if (!hasTest) {
            missingTests.push(relativePath);
        }
    });
    const totalFiles = testableFiles.length;
    const testedFiles = totalFiles - missingTests.length;
    const coveragePercentage = totalFiles > 0 ? Math.round((testedFiles / totalFiles) * 100) : 0;
    const recommendations = [];
    if (coveragePercentage < 50) {
        recommendations.push("Aim for at least 50% test coverage");
    }
    if (coveragePercentage < 80) {
        recommendations.push("Consider increasing test coverage to 80%");
    }
    if (missingTests.length > 0) {
        recommendations.push(`Add tests for ${missingTests.length} untested files`);
    }
    return {
        totalFiles,
        testedFiles,
        coveragePercentage,
        missingTests,
        recommendations,
    };
};
// Test kalitesi analizi
const analyzeTestQuality = (testFiles) => {
    const issues = [];
    const recommendations = [];
    let score = 100;
    testFiles.forEach((testFile) => {
        try {
            const content = fs_extra_1.default.readFileSync(testFile, "utf8");
            const relativePath = testFile.replace(process.cwd(), "").substring(1);
            // Test assertion'ları kontrol et
            const assertionMatches = content.match(/(expect|assert|should)/g);
            if (!assertionMatches || assertionMatches.length < 2) {
                issues.push(`${relativePath}: Missing assertions`);
                score -= 10;
            }
            // Test description'ları kontrol et
            const describeMatches = content.match(/describe\s*\(['"`]([^'"`]+)['"`]/g);
            const itMatches = content.match(/it\s*\(['"`]([^'"`]+)['"`]/g);
            const testMatches = content.match(/test\s*\(['"`]([^'"`]+)['"`]/g);
            if (!describeMatches && !itMatches && !testMatches) {
                issues.push(`${relativePath}: Missing test descriptions`);
                score -= 5;
            }
            // Mock kullanımı kontrol et
            const mockMatches = content.match(/(jest\.mock|mock|spyOn)/g);
            if (!mockMatches) {
                issues.push(`${relativePath}: Consider using mocks for external dependencies`);
                score -= 3;
            }
            // Setup/teardown kontrol et
            const setupMatches = content.match(/(beforeEach|afterEach|beforeAll|afterAll)/g);
            if (!setupMatches) {
                issues.push(`${relativePath}: Consider using setup/teardown functions`);
                score -= 2;
            }
        }
        catch (error) {
            // Ignore errors
        }
    });
    // Öneriler
    if (score < 80) {
        recommendations.push("Add proper assertions to all tests");
        recommendations.push("Use descriptive test names");
        recommendations.push("Implement proper mocking strategy");
    }
    return { score: Math.max(0, score), issues, recommendations };
};
// Test pattern'lerini analiz et
const analyzeTestPatterns = (testFiles) => {
    const frameworks = [];
    const patterns = [];
    const recommendations = [];
    testFiles.forEach((testFile) => {
        try {
            const content = fs_extra_1.default.readFileSync(testFile, "utf8");
            // Test framework'lerini tespit et
            if (content.includes("jest") ||
                content.includes("describe") ||
                content.includes("it")) {
                if (!frameworks.includes("Jest")) {
                    frameworks.push("Jest");
                }
            }
            if (content.includes("@testing-library/react") ||
                content.includes("render")) {
                if (!frameworks.includes("React Testing Library")) {
                    frameworks.push("React Testing Library");
                }
            }
            if (content.includes("@testing-library/react-native") ||
                content.includes("fireEvent")) {
                if (!frameworks.includes("React Native Testing Library")) {
                    frameworks.push("React Native Testing Library");
                }
            }
            if (content.includes("cypress") || content.includes("cy.")) {
                if (!frameworks.includes("Cypress")) {
                    frameworks.push("Cypress");
                }
            }
            // Test pattern'lerini tespit et
            if (content.includes("userEvent")) {
                patterns.push("User Interaction Testing");
            }
            if (content.includes("screen.getBy") || content.includes("getByText")) {
                patterns.push("Accessibility Testing");
            }
            if (content.includes("waitFor") || content.includes("findBy")) {
                patterns.push("Async Testing");
            }
            if (content.includes("mockImplementation") ||
                content.includes("mockReturnValue")) {
                patterns.push("Mocking");
            }
            if (content.includes("snapshot")) {
                patterns.push("Snapshot Testing");
            }
        }
        catch (error) {
            // Ignore errors
        }
    });
    // Öneriler
    if (!frameworks.includes("Jest")) {
        recommendations.push("Consider using Jest as your test runner");
    }
    if (!frameworks.includes("React Testing Library") &&
        !frameworks.includes("React Native Testing Library")) {
        recommendations.push("Consider using React Testing Library for component testing");
    }
    if (!patterns.includes("User Interaction Testing")) {
        recommendations.push("Add user interaction tests");
    }
    if (!patterns.includes("Accessibility Testing")) {
        recommendations.push("Include accessibility testing");
    }
    return { frameworks, patterns, recommendations };
};
// Testing analizi yap
const analyzeTesting = (allFiles) => {
    const testFiles = allFiles.filter((file) => file.includes(".test.") ||
        file.includes(".spec.") ||
        file.includes("__tests__/"));
    const coverage = analyzeTestCoverage(allFiles);
    const testQuality = analyzeTestQuality(testFiles);
    const testPatterns = analyzeTestPatterns(testFiles);
    return {
        coverage,
        testQuality,
        testPatterns,
    };
};
exports.analyzeTesting = analyzeTesting;
