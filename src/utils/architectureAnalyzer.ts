import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";

export interface ArchitectureMetrics {
  folderStructure: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  namingConventions: {
    score: number;
    violations: string[];
    recommendations: string[];
  };
  componentHierarchy: {
    maxDepth: number;
    averageDepth: number;
    deepComponents: string[];
    recommendations: string[];
  };
  stateManagement: {
    patterns: string[];
    recommendations: string[];
  };
}

// Klasör yapısını analiz et
const analyzeFolderStructure = (
  projectRoot: string
): {
  score: number;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
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
    const folderPath = path.join(projectRoot, folder);
    if (!fs.existsSync(folderPath)) {
      issues.push(`Missing required folder: ${folder}`);
      score -= 10;
    }
  });

  // Opsiyonel klasörlerin varlığını kontrol et
  optionalFolders.forEach((folder) => {
    const folderPath = path.join(projectRoot, folder);
    if (fs.existsSync(folderPath)) {
      score += 5; // Bonus puan
    }
  });

  // Klasör derinliğini kontrol et
  const checkFolderDepth = (dir: string, currentDepth: number = 0): void => {
    if (currentDepth > 4) {
      issues.push(
        `Deep folder structure detected: ${dir} (depth: ${currentDepth})`
      );
      score -= 5;
    }

    try {
      const items = fs.readdirSync(dir);
      items.forEach((item) => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (
          stat.isDirectory() &&
          !item.startsWith(".") &&
          item !== "node_modules"
        ) {
          checkFolderDepth(fullPath, currentDepth + 1);
        }
      });
    } catch (error) {
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
const analyzeNamingConventions = (
  allFiles: string[]
): {
  score: number;
  violations: string[];
  recommendations: string[];
} => {
  const violations: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  allFiles.forEach((filePath) => {
    const fileName = path.basename(filePath);
    const relativePath = filePath.replace(process.cwd(), "").substring(1);

    // PascalCase kontrolü (component dosyaları için)
    if (
      relativePath.includes("/components/") ||
      relativePath.includes("/screens/")
    ) {
      const componentName = path.basename(fileName, path.extname(fileName));
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
        violations.push(
          `${relativePath}: Component should use PascalCase (${componentName})`
        );
        score -= 5;
      }
    }

    // camelCase kontrolü (hook dosyaları için)
    if (relativePath.includes("/hooks/")) {
      const hookName = path.basename(fileName, path.extname(fileName));
      if (!/^use[A-Z][a-zA-Z0-9]*$/.test(hookName)) {
        violations.push(
          `${relativePath}: Hook should start with 'use' and use PascalCase (${hookName})`
        );
        score -= 5;
      }
    }

    // camelCase kontrolü (util dosyaları için)
    if (relativePath.includes("/utils/")) {
      const utilName = path.basename(fileName, path.extname(fileName));
      if (!/^[a-z][a-zA-Z0-9]*$/.test(utilName)) {
        violations.push(
          `${relativePath}: Utility should use camelCase (${utilName})`
        );
        score -= 3;
      }
    }

    // Dosya uzantısı kontrolü
    const ext = path.extname(fileName);
    if (![".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
      violations.push(
        `${relativePath}: Use .js, .jsx, .ts, or .tsx extensions`
      );
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
const analyzeComponentHierarchy = (
  allFiles: string[]
): {
  maxDepth: number;
  averageDepth: number;
  deepComponents: string[];
  recommendations: string[];
} => {
  const depths: number[] = [];
  const deepComponents: string[] = [];

  allFiles.forEach((filePath) => {
    if (filePath.includes("/components/") || filePath.includes("/screens/")) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
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
      } catch (error) {
        // Ignore errors
      }
    }
  });

  const maxDepth = Math.max(...depths, 0);
  const averageDepth =
    depths.length > 0
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
const analyzeStateManagement = (
  allFiles: string[]
): {
  patterns: string[];
  recommendations: string[];
} => {
  const patterns: string[] = [];
  const recommendations: string[] = [];

  allFiles.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");

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
    } catch (error) {
      // Ignore errors
    }
  });

  // Öneriler
  if (patterns.length === 0) {
    recommendations.push("Consider implementing a state management solution");
  } else if (patterns.length > 2) {
    recommendations.push("Consider consolidating state management patterns");
  }

  if (
    patterns.includes("Local State") &&
    !patterns.includes("Context API") &&
    !patterns.includes("Redux")
  ) {
    recommendations.push("Consider using Context API for shared state");
  }

  return { patterns, recommendations };
};

// Architecture analizi yap
export const analyzeArchitecture = (
  projectRoot: string,
  allFiles: string[]
): ArchitectureMetrics => {
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
 