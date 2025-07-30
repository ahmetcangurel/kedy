import fs from "fs";
import { createSpinner } from "nanospinner";
import { loadConfig } from "../utils/configLoader";
import { logger } from "../utils/logger";
import { analyzeProject, ImportInfo } from "../utils/importAnalyzer";

export const fixImports = (options: {
  autoFix?: boolean;
  detailed?: boolean;
}) => {
  const spinner = createSpinner("Analyzing imports...").start();

  try {
    const config = loadConfig();
    const { importAnalysis } = config;

    // Analiz yap
    const result = analyzeProject(config);

    if (result.totalUnusedImports === 0) {
      spinner.success({ text: "🎉 No unused imports found!" });
      return;
    }

    // Özet rapor
    console.log("\n📊 Import Analysis Summary:");
    console.log(`📁 Total files scanned: ${result.totalFiles}`);
    console.log(`⚠️  Files with issues: ${result.filesWithIssues}`);
    console.log(`❌ Total unused imports: ${result.totalUnusedImports}`);

    // Detaylı rapor
    if (options.detailed ?? importAnalysis.detailedReport) {
      console.log("\n🔍 Detailed Report:");

      result.details.forEach((fileInfo: ImportInfo) => {
        const relativePath = fileInfo.filePath
          .replace(process.cwd(), "")
          .substring(1);
        console.log(`\n📁 ${relativePath}`);

        fileInfo.unusedImports.forEach((importInfo) => {
          console.log(
            `   ❌ Line ${importInfo.line}: ${importInfo.items.join(
              ", "
            )} from '${importInfo.source}'`
          );
        });
      });
    }

    // Otomatik düzeltme
    if (options.autoFix ?? importAnalysis.autoFix) {
      console.log("\n🔧 Auto-fixing unused imports...");
      let fixedFiles = 0;

      result.details.forEach((fileInfo: ImportInfo) => {
        if (fixFileImports(fileInfo)) {
          fixedFiles++;
        }
      });

      console.log(`✅ Fixed ${fixedFiles} files`);
    } else {
      console.log("\n💡 To auto-fix, run: kedy fix:imports --auto-fix");
    }

    spinner.success({ text: "Import analysis completed!" });
  } catch (error: any) {
    spinner.error({ text: `Failed to analyze imports: ${error.message}` });
    logger.error(error);
  }
};

// Dosyadaki kullanılmayan import'ları düzelt
const fixFileImports = (fileInfo: ImportInfo): boolean => {
  try {
    const content = fs.readFileSync(fileInfo.filePath, "utf8");
    const lines = content.split("\n");
    let modified = false;

    // Kullanılmayan import'ları kaldır
    fileInfo.unusedImports.forEach((importInfo) => {
      const lineIndex = importInfo.line - 1;
      const originalLine = lines[lineIndex];

      // Default import: import React from 'react'
      const defaultImportMatch = originalLine.match(
        /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/
      );
      if (defaultImportMatch) {
        // Tüm default import'ı kaldır
        lines[lineIndex] = "";
        modified = true;
        return;
      }

      // Named imports: import { Text, View } from 'react-native'
      const namedImportMatch = originalLine.match(
        /import\s*{([^}]+)}\s+from\s+['"]([^'"]+)['"]/
      );
      if (namedImportMatch) {
        const allItems = namedImportMatch[1]
          .split(",")
          .map((item) => item.trim());
        const remainingItems = allItems.filter(
          (item) => !importInfo.items.includes(item)
        );

        if (remainingItems.length === 0) {
          // Tüm import'ı kaldır
          lines[lineIndex] = "";
        } else {
          // Sadece kullanılmayan item'ları kaldır
          const newImport = `import { ${remainingItems.join(", ")} } from '${
            namedImportMatch[2]
          }'`;
          lines[lineIndex] = newImport;
        }
        modified = true;
        return;
      }

      // Mixed imports: import React, { useState } from 'react'
      const mixedImportMatch = originalLine.match(
        /import\s+(\w+)\s*,\s*{([^}]+)}\s+from\s+['"]([^'"]+)['"]/
      );
      if (mixedImportMatch) {
        const defaultItem = mixedImportMatch[1];
        const allNamedItems = mixedImportMatch[2]
          .split(",")
          .map((item) => item.trim());
        const remainingNamedItems = allNamedItems.filter(
          (item) => !importInfo.items.includes(item)
        );

        if (remainingNamedItems.length === 0) {
          // Sadece default import kalır
          lines[
            lineIndex
          ] = `import ${defaultItem} from '${mixedImportMatch[3]}'`;
        } else {
          // Hem default hem named import'lar kalır
          const newImport = `import ${defaultItem}, { ${remainingNamedItems.join(
            ", "
          )} } from '${mixedImportMatch[3]}'`;
          lines[lineIndex] = newImport;
        }
        modified = true;
      }
    });

    // Boş satırları temizle
    const cleanedLines = lines.filter((line) => line.trim() !== "");

    if (modified) {
      fs.writeFileSync(fileInfo.filePath, cleanedLines.join("\n"), "utf8");
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Error fixing file ${fileInfo.filePath}: ${error}`);
    return false;
  }
};
