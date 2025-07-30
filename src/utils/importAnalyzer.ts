import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";

export interface ImportInfo {
  filePath: string;
  imports: {
    source: string;
    items: string[];
    line: number;
  }[];
  unusedImports: {
    source: string;
    items: string[];
    line: number;
  }[];
  usedImports: {
    source: string;
    items: string[];
    line: number;
  }[];
}

export interface AnalysisResult {
  totalFiles: number;
  filesWithIssues: number;
  totalUnusedImports: number;
  details: ImportInfo[];
}

// Dosya içeriğinden import'ları çıkar
export const extractImports = (
  content: string
): { source: string; items: string[]; line: number }[] => {
  const imports: { source: string; items: string[]; line: number }[] = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Default import: import React from 'react'
    const defaultImportMatch = line.match(
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/
    );
    if (defaultImportMatch) {
      imports.push({
        source: defaultImportMatch[2],
        items: [defaultImportMatch[1]],
        line: lineNumber,
      });
      return;
    }

    // Named imports: import { Text, View } from 'react-native'
    const namedImportMatch = line.match(
      /import\s*{([^}]+)}\s+from\s+['"]([^'"]+)['"]/
    );
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
    const mixedImportMatch = line.match(
      /import\s+(\w+)\s*,\s*{([^}]+)}\s+from\s+['"]([^'"]+)['"]/
    );
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

// Dosya içeriğinde import'ların kullanılıp kullanılmadığını kontrol et
export const checkImportUsage = (
  content: string,
  imports: { source: string; items: string[]; line: number }[]
): {
  used: { source: string; items: string[]; line: number }[];
  unused: { source: string; items: string[]; line: number }[];
} => {
  const used: { source: string; items: string[]; line: number }[] = [];
  const unused: { source: string; items: string[]; line: number }[] = [];

  imports.forEach((importInfo) => {
    const usedItems: string[] = [];
    const unusedItems: string[] = [];

    importInfo.items.forEach((item) => {
      // Import edilen item'ın dosyada kullanılıp kullanılmadığını kontrol et
      const regex = new RegExp(`\\b${item}\\b`, "g");
      const matches = content.match(regex);

      if (matches && matches.length > 1) {
        // 1'den fazla çünkü import satırı da sayılıyor
        usedItems.push(item);
      } else {
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

// Dosyayı analiz et
export const analyzeFile = (filePath: string): ImportInfo | null => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const imports = extractImports(content);
    const { used, unused } = checkImportUsage(content, imports);

    return {
      filePath,
      imports,
      usedImports: used,
      unusedImports: unused,
    };
  } catch (error) {
    logger.error(`Error analyzing file ${filePath}: ${error}`);
    return null;
  }
};

// Klasördeki tüm dosyaları bul
export const findFiles = (
  dir: string,
  extensions: string[],
  excludeDirs: string[]
): string[] => {
  const files: string[] = [];

  const scanDirectory = (currentDir: string) => {
    try {
      const items = fs.readdirSync(currentDir);

      items.forEach((item) => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Dışarıda bırakılacak klasörleri kontrol et
          const shouldExclude = excludeDirs.some(
            (excludeDir) => fullPath.includes(excludeDir) || item === excludeDir
          );

          if (!shouldExclude) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          // Dosya uzantısını kontrol et
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      });
    } catch (error) {
      logger.error(`Error scanning directory ${currentDir}: ${error}`);
    }
  };

  scanDirectory(dir);
  return files;
};

// Projeyi analiz et
export const analyzeProject = (config: any): AnalysisResult => {
  const { importAnalysis } = config;
  const { fileExtensions, scanFolders, excludeFiles } = importAnalysis;

  let allFiles: string[] = [];

  // Belirtilen klasörleri tara
  scanFolders.forEach((folder: string) => {
    const folderPath = path.resolve(process.cwd(), folder);
    if (fs.existsSync(folderPath)) {
      const files = findFiles(folderPath, fileExtensions, excludeFiles);
      allFiles = [...allFiles, ...files];
    }
  });

  const details: ImportInfo[] = [];
  let totalUnusedImports = 0;

  // Her dosyayı analiz et
  allFiles.forEach((filePath) => {
    const result = analyzeFile(filePath);
    if (result && result.unusedImports.length > 0) {
      details.push(result);
      totalUnusedImports += result.unusedImports.reduce(
        (sum, imp) => sum + imp.items.length,
        0
      );
    }
  });

  return {
    totalFiles: allFiles.length,
    filesWithIssues: details.length,
    totalUnusedImports,
    details,
  };
};
 