import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";

export interface UnusedFileInfo {
  filePath: string;
  relativePath: string;
  size: number;
  lastModified: Date;
  type: "component" | "screen" | "util" | "other";
}

export interface UnusedFileResult {
  totalFiles: number;
  unusedFiles: number;
  details: UnusedFileInfo[];
}

// Dosya türünü belirle
const getFileType = (
  filePath: string
): "component" | "screen" | "util" | "other" => {
  const relativePath = filePath.replace(process.cwd(), "").substring(1);

  if (relativePath.includes("/components/")) return "component";
  if (relativePath.includes("/screens/")) return "screen";
  if (relativePath.includes("/utils/") || relativePath.includes("/helpers/"))
    return "util";

  return "other";
};

// Dosya adından export edilen isimleri tahmin et
const getExportNames = (filePath: string, content: string): string[] => {
  const fileName = path.basename(filePath, path.extname(filePath));
  const names: string[] = [];

  // Default export için dosya adını kullan
  names.push(fileName);

  // Named exports'ları bul
  const exportMatches = content.match(
    /export\s+(?:const|function|class)\s+(\w+)/g
  );
  if (exportMatches) {
    exportMatches.forEach((match) => {
      const nameMatch = match.match(
        /export\s+(?:const|function|class)\s+(\w+)/
      );
      if (nameMatch) {
        names.push(nameMatch[1]);
      }
    });
  }

  // Export default ile export edilen isimleri bul
  const defaultExportMatches = content.match(/export\s+default\s+(\w+)/g);
  if (defaultExportMatches) {
    defaultExportMatches.forEach((match) => {
      const nameMatch = match.match(/export\s+default\s+(\w+)/);
      if (nameMatch) {
        names.push(nameMatch[1]);
      }
    });
  }

  return [...new Set(names)]; // Duplicate'ları kaldır
};

// Dosyada import/require kullanımını kontrol et
const isFileImported = (filePath: string, projectFiles: string[]): boolean => {
  const fileName = path.basename(filePath, path.extname(filePath));
  const relativePath = filePath.replace(process.cwd(), "").substring(1);
  const dirName = path.dirname(relativePath);

  // Dosya adından oluşturulabilecek import yolları
  const possibleImportPaths = [
    `./${fileName}`,
    `../${fileName}`,
    `../../${fileName}`,
    `../../../${fileName}`,
    `./${fileName}/${fileName}`,
    `../${fileName}/${fileName}`,
    `./${dirName}/${fileName}`,
    `../${dirName}/${fileName}`,
  ];

  // Tüm proje dosyalarını kontrol et
  for (const projectFile of projectFiles) {
    if (projectFile === filePath) continue; // Kendisini kontrol etme

    try {
      const content = fs.readFileSync(projectFile, "utf8");

      // Import/require kullanımını kontrol et
      const importPatterns = [
        // ES6 imports
        new RegExp(`import\\s+.*\\s+from\\s+['"]${fileName}['"]`, "g"),
        new RegExp(`import\\s+.*\\s+from\\s+['"]\\./${fileName}['"]`, "g"),
        new RegExp(`import\\s+.*\\s+from\\s+['"]\\.\\./${fileName}['"]`, "g"),
        new RegExp(
          `import\\s+.*\\s+from\\s+['"]\\.\\./\\.\\./${fileName}['"]`,
          "g"
        ),

        // Require statements
        new RegExp(`require\\(['"]${fileName}['"]\\)`, "g"),
        new RegExp(`require\\(['"]\\./${fileName}['"]\\)`, "g"),
        new RegExp(`require\\(['"]\\.\\./${fileName}['"]\\)`, "g"),
        new RegExp(`require\\(['"]\\.\\./\\.\\./${fileName}['"]\\)`, "g"),

        // Relative path imports
        ...possibleImportPaths.map(
          (p) => new RegExp(`import\\s+.*\\s+from\\s+['"]${p}['"]`, "g")
        ),
        ...possibleImportPaths.map(
          (p) => new RegExp(`require\\(['"]${p}['"]\\)`, "g")
        ),
      ];

      // Her pattern'i kontrol et
      for (const pattern of importPatterns) {
        if (pattern.test(content)) {
          return true; // Dosya kullanılıyor
        }
      }

      // Export edilen isimleri kontrol et
      const exportNames = getExportNames(
        filePath,
        fs.readFileSync(filePath, "utf8")
      );
      for (const exportName of exportNames) {
        const namePatterns = [
          new RegExp(`import\\s+.*\\b${exportName}\\b.*\\s+from`, "g"),
          new RegExp(
            `import\\s+{\\s*.*\\b${exportName}\\b.*\\s*}\\s+from`,
            "g"
          ),
          new RegExp(`const\\s+{\\s*.*\\b${exportName}\\b.*\\s*}\\s*=`, "g"),
        ];

        for (const pattern of namePatterns) {
          if (pattern.test(content)) {
            return true; // Export edilen isim kullanılıyor
          }
        }
      }
    } catch (error) {
      // Dosya okunamazsa atla
      continue;
    }
  }

  return false; // Dosya kullanılmıyor
};

// Klasördeki tüm dosyaları bul
const findProjectFiles = (
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
export const findUnusedFiles = (config: any): UnusedFileResult => {
  const { importAnalysis } = config;
  const { fileExtensions, scanFolders, excludeFiles } = importAnalysis;

  let allFiles: string[] = [];

  // Belirtilen klasörleri tara
  scanFolders.forEach((folder: string) => {
    const folderPath = path.resolve(process.cwd(), folder);
    if (fs.existsSync(folderPath)) {
      const files = findProjectFiles(folderPath, fileExtensions, excludeFiles);
      allFiles = [...allFiles, ...files];
    }
  });

  const unusedFiles: UnusedFileInfo[] = [];

  // Her dosyayı kontrol et
  allFiles.forEach((filePath) => {
    try {
      const stat = fs.statSync(filePath);
      const isImported = isFileImported(filePath, allFiles);

      if (!isImported) {
        unusedFiles.push({
          filePath,
          relativePath: filePath.replace(process.cwd(), "").substring(1),
          size: stat.size,
          lastModified: stat.mtime,
          type: getFileType(filePath),
        });
      }
    } catch (error) {
      logger.error(`Error analyzing file ${filePath}: ${error}`);
    }
  });

  return {
    totalFiles: allFiles.length,
    unusedFiles: unusedFiles.length,
    details: unusedFiles,
  };
};
 