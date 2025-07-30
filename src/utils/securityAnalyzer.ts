import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";

export interface SecurityMetrics {
  dependencies: {
    vulnerablePackages: string[];
    outdatedPackages: string[];
    recommendations: string[];
  };
  codeSecurity: {
    hardcodedSecrets: string[];
    sqlInjection: string[];
    xssVulnerabilities: string[];
    recommendations: string[];
  };
  apiSecurity: {
    endpoints: string[];
    issues: string[];
    recommendations: string[];
  };
  inputValidation: {
    missingValidation: string[];
    weakValidation: string[];
    recommendations: string[];
  };
}

// Dependency güvenlik analizi
const analyzeDependencies = async (
  projectRoot: string
): Promise<{
  vulnerablePackages: string[];
  outdatedPackages: string[];
  recommendations: string[];
}> => {
  const vulnerablePackages: string[] = [];
  const outdatedPackages: string[] = [];
  const recommendations: string[] = [];

  try {
    // package.json dosyasını oku
    const packageJsonPath = path.join(projectRoot, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);

      // Basit güvenlik kontrolü - gerçek uygulamada npm audit kullanılır
      const knownVulnerablePackages = [
        "lodash", // Eski versiyonlarda güvenlik açıkları
        "moment", // Eski versiyonlarda güvenlik açıkları
        "axios", // Belirli versiyonlarda güvenlik açıkları
      ];

      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      Object.keys(allDependencies).forEach((packageName) => {
        if (knownVulnerablePackages.includes(packageName)) {
          vulnerablePackages.push(
            `${packageName}@${allDependencies[packageName]}`
          );
        }
      });

      // Eski versiyon kontrolü (basit)
      Object.entries(allDependencies).forEach(([packageName, version]) => {
        if (
          typeof version === "string" &&
          (version.includes("^0.") || version.includes("~0."))
        ) {
          outdatedPackages.push(`${packageName}@${version}`);
        }
      });
    }
  } catch (error) {
    logger.error(`Error analyzing dependencies: ${error}`);
  }

  // Öneriler
  if (vulnerablePackages.length > 0) {
    recommendations.push("Run npm audit to check for security vulnerabilities");
    recommendations.push("Update vulnerable packages to latest versions");
  }

  if (outdatedPackages.length > 0) {
    recommendations.push(
      "Consider updating packages to latest stable versions"
    );
  }

  return { vulnerablePackages, outdatedPackages, recommendations };
};

// Kod güvenlik analizi
const analyzeCodeSecurity = (
  allFiles: string[]
): {
  hardcodedSecrets: string[];
  sqlInjection: string[];
  xssVulnerabilities: string[];
  recommendations: string[];
} => {
  const hardcodedSecrets: string[] = [];
  const sqlInjection: string[] = [];
  const xssVulnerabilities: string[] = [];
  const recommendations: string[] = [];

  allFiles.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const relativePath = filePath.replace(process.cwd(), "").substring(1);

      // Hardcoded secrets tespiti
      const secretPatterns = [
        /api[_-]?key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
        /password\s*[:=]\s*['"`][^'"`]+['"`]/gi,
        /secret\s*[:=]\s*['"`][^'"`]+['"`]/gi,
        /token\s*[:=]\s*['"`][^'"`]+['"`]/gi,
        /private[_-]?key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
      ];

      secretPatterns.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            hardcodedSecrets.push(`${relativePath}: ${match.trim()}`);
          });
        }
      });

      // SQL Injection tespiti (basit)
      const sqlPatterns = [
        /query\s*\(\s*[^)]*\$\{[^}]*\}[^)]*\)/gi,
        /execute\s*\(\s*[^)]*\$\{[^}]*\}[^)]*\)/gi,
      ];

      sqlPatterns.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            sqlInjection.push(`${relativePath}: ${match.trim()}`);
          });
        }
      });

      // XSS tespiti
      const xssPatterns = [
        /dangerouslySetInnerHTML\s*=\s*\{[^}]*\}/gi,
        /innerHTML\s*=\s*[^;]+/gi,
        /document\.write\s*\([^)]*\)/gi,
      ];

      xssPatterns.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            xssVulnerabilities.push(`${relativePath}: ${match.trim()}`);
          });
        }
      });
    } catch (error) {
      // Ignore errors
    }
  });

  // Öneriler
  if (hardcodedSecrets.length > 0) {
    recommendations.push("Move secrets to environment variables");
    recommendations.push("Use .env files for configuration");
  }

  if (sqlInjection.length > 0) {
    recommendations.push("Use parameterized queries to prevent SQL injection");
    recommendations.push("Validate and sanitize user inputs");
  }

  if (xssVulnerabilities.length > 0) {
    recommendations.push("Avoid using dangerouslySetInnerHTML");
    recommendations.push("Sanitize user inputs before rendering");
  }

  return {
    hardcodedSecrets,
    sqlInjection,
    xssVulnerabilities,
    recommendations,
  };
};

// API güvenlik analizi
const analyzeApiSecurity = (
  allFiles: string[]
): {
  endpoints: string[];
  issues: string[];
  recommendations: string[];
} => {
  const endpoints: string[] = [];
  const issues: string[] = [];
  const recommendations: string[] = [];

  allFiles.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const relativePath = filePath.replace(process.cwd(), "").substring(1);

      // API endpoint'lerini tespit et
      const endpointPatterns = [
        /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi,
        /axios\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
        /\.get\s*\(\s*['"`]([^'"`]+)['"`]/gi,
        /\.post\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      ];

      endpointPatterns.forEach((pattern) => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const endpoint = match[1] || match[2];
          if (endpoint && !endpoints.includes(endpoint)) {
            endpoints.push(endpoint);
          }
        }
      });

      // HTTP endpoint güvenlik kontrolü
      const httpEndpoints = endpoints.filter(
        (endpoint) =>
          endpoint.startsWith("http://") && !endpoint.startsWith("https://")
      );

      if (httpEndpoints.length > 0) {
        issues.push(`${relativePath}: Using HTTP instead of HTTPS`);
      }

      // Authentication kontrolü
      const authPatterns = [
        /Authorization\s*:\s*['"`][^'"`]*['"`]/gi,
        /Bearer\s+[^'"`\s]+/gi,
      ];

      const hasAuth = authPatterns.some((pattern) => content.match(pattern));
      if (!hasAuth && content.includes("fetch(")) {
        issues.push(`${relativePath}: Missing authentication headers`);
      }
    } catch (error) {
      // Ignore errors
    }
  });

  // Öneriler
  if (issues.length > 0) {
    recommendations.push("Use HTTPS for all API calls");
    recommendations.push("Implement proper authentication");
    recommendations.push("Add request/response validation");
  }

  return { endpoints, issues, recommendations };
};

// Input validation analizi
const analyzeInputValidation = (
  allFiles: string[]
): {
  missingValidation: string[];
  weakValidation: string[];
  recommendations: string[];
} => {
  const missingValidation: string[] = [];
  const weakValidation: string[] = [];
  const recommendations: string[] = [];

  allFiles.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const relativePath = filePath.replace(process.cwd(), "").substring(1);

      // Form input'larını tespit et
      const inputPatterns = [
        /<input[^>]*>/gi,
        /<TextInput[^>]*>/gi,
        /onChange\s*=\s*\{[^}]*\}/gi,
      ];

      const hasInputs = inputPatterns.some((pattern) => content.match(pattern));

      if (hasInputs) {
        // Validation pattern'lerini kontrol et
        const validationPatterns = [
          /validate\s*\(/gi,
          /validation\s*:/gi,
          /required\s*=/gi,
          /pattern\s*=/gi,
          /minLength\s*=/gi,
          /maxLength\s*=/gi,
        ];

        const hasValidation = validationPatterns.some((pattern) =>
          content.match(pattern)
        );

        if (!hasValidation) {
          missingValidation.push(relativePath);
        } else {
          // Zayıf validation kontrolü
          const weakPatterns = [
            /required\s*=\s*true/gi,
            /pattern\s*=\s*['"`].*['"`]/gi,
          ];

          const hasWeakValidation = weakPatterns.some((pattern) =>
            content.match(pattern)
          );
          if (hasWeakValidation) {
            weakValidation.push(relativePath);
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
  });

  // Öneriler
  if (missingValidation.length > 0) {
    recommendations.push("Add input validation for all user inputs");
    recommendations.push(
      "Use form validation libraries like Formik or React Hook Form"
    );
  }

  if (weakValidation.length > 0) {
    recommendations.push("Implement stronger validation rules");
    recommendations.push("Add server-side validation");
  }

  return { missingValidation, weakValidation, recommendations };
};

// Security analizi yap
export const analyzeSecurity = async (
  projectRoot: string,
  allFiles: string[]
): Promise<SecurityMetrics> => {
  const dependencies = await analyzeDependencies(projectRoot);
  const codeSecurity = analyzeCodeSecurity(allFiles);
  const apiSecurity = analyzeApiSecurity(allFiles);
  const inputValidation = analyzeInputValidation(allFiles);

  return {
    dependencies,
    codeSecurity,
    apiSecurity,
    inputValidation,
  };
};
 