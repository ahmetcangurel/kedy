import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";

export interface DeleteOptions {
  force?: boolean;
  recursive?: boolean;
  backup?: boolean;
}

export interface DeleteResult {
  success: boolean;
  deletedFiles: string[];
  deletedFolders: string[];
  errors: string[];
  totalSize: number;
}

// Dosya türünü belirle
const getFileType = (filePath: string): "screen" | "component" | "other" => {
  const relativePath = filePath.replace(process.cwd(), "").substring(1);

  if (relativePath.includes("/screens/")) return "screen";
  if (relativePath.includes("/components/")) return "component";

  return "other";
};

// Dosya ve klasör boyutunu hesapla
const calculateSize = (filePath: string): number => {
  try {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      return stat.size;
    } else if (stat.isDirectory()) {
      let totalSize = 0;
      const items = fs.readdirSync(filePath);
      items.forEach((item) => {
        const fullPath = path.join(filePath, item);
        totalSize += calculateSize(fullPath);
      });
      return totalSize;
    }
  } catch (error) {
    logger.error(`Error calculating size for ${filePath}: ${error}`);
  }
  return 0;
};

// Dosyayı yedekle
const backupFile = (filePath: string): string | null => {
  try {
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    logger.error(`Error backing up ${filePath}: ${error}`);
    return null;
  }
};

// Dosyayı sil
const deleteFile = (
  filePath: string,
  options: DeleteOptions
): { success: boolean; error?: string } => {
  try {
    if (options.backup) {
      backupFile(filePath);
    }

    fs.unlinkSync(filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Klasörü sil
const deleteFolder = (
  folderPath: string,
  options: DeleteOptions
): { success: boolean; error?: string } => {
  try {
    if (options.backup) {
      // Klasör içindeki tüm dosyaları yedekle
      const backupFolder = (currentPath: string) => {
        const items = fs.readdirSync(currentPath);
        items.forEach((item) => {
          const fullPath = path.join(currentPath, item);
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            backupFile(fullPath);
          } else if (stat.isDirectory()) {
            backupFolder(fullPath);
          }
        });
      };
      backupFolder(folderPath);
    }

    if (options.recursive) {
      fs.rmSync(folderPath, { recursive: true, force: options.force || false });
    } else {
      fs.rmdirSync(folderPath);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Dosya veya klasörü sil
export const deleteFileOrFolder = (
  targetPath: string,
  options: DeleteOptions = {}
): DeleteResult => {
  const result: DeleteResult = {
    success: false,
    deletedFiles: [],
    deletedFolders: [],
    errors: [],
    totalSize: 0,
  };

  try {
    const fullPath = path.resolve(process.cwd(), targetPath);

    if (!fs.existsSync(fullPath)) {
      result.errors.push(`Path does not exist: ${targetPath}`);
      return result;
    }

    const stat = fs.statSync(fullPath);
    const fileType = getFileType(fullPath);
    const size = calculateSize(fullPath);

    // Onay mesajı
    const typeText =
      fileType === "screen"
        ? "Screen"
        : fileType === "component"
        ? "Component"
        : "File";
    const sizeKB = (size / 1024).toFixed(2);

    logger.info(`🗑️  Deleting ${typeText}: ${targetPath} (${sizeKB} KB)`);

    if (stat.isFile()) {
      const deleteResult = deleteFile(fullPath, options);
      if (deleteResult.success) {
        result.deletedFiles.push(targetPath);
        result.totalSize += size;
      } else {
        result.errors.push(
          `Failed to delete file ${targetPath}: ${deleteResult.error}`
        );
      }
    } else if (stat.isDirectory()) {
      const deleteResult = deleteFolder(fullPath, options);
      if (deleteResult.success) {
        result.deletedFolders.push(targetPath);
        result.totalSize += size;
      } else {
        result.errors.push(
          `Failed to delete folder ${targetPath}: ${deleteResult.error}`
        );
      }
    }

    result.success = result.errors.length === 0;
  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`);
  }

  return result;
};

// Birden fazla dosyayı sil
export const deleteMultipleFiles = (
  filePaths: string[],
  options: DeleteOptions = {}
): DeleteResult => {
  const result: DeleteResult = {
    success: false,
    deletedFiles: [],
    deletedFolders: [],
    errors: [],
    totalSize: 0,
  };

  filePaths.forEach((filePath) => {
    const deleteResult = deleteFileOrFolder(filePath, options);

    result.deletedFiles.push(...deleteResult.deletedFiles);
    result.deletedFolders.push(...deleteResult.deletedFolders);
    result.errors.push(...deleteResult.errors);
    result.totalSize += deleteResult.totalSize;
  });

  result.success = result.errors.length === 0;
  return result;
};

// Pattern'e göre dosyaları bul ve sil
export const deleteByPattern = (
  pattern: string,
  options: DeleteOptions = {}
): DeleteResult => {
  const result: DeleteResult = {
    success: false,
    deletedFiles: [],
    deletedFolders: [],
    errors: [],
    totalSize: 0,
  };

  try {
    // Basit pattern matching
    const searchPattern = pattern.replace(/\*/g, ".*");
    const regex = new RegExp(searchPattern, "i");

    const findFiles = (dir: string): string[] => {
      const files: string[] = [];

      try {
        const items = fs.readdirSync(dir);
        items.forEach((item) => {
          const fullPath = path.join(dir, item);
          const relativePath = fullPath.replace(process.cwd(), "").substring(1);

          if (regex.test(relativePath)) {
            files.push(relativePath);
          }

          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            files.push(...findFiles(fullPath));
          }
        });
      } catch (error) {
        logger.error(`Error searching in ${dir}: ${error}`);
      }

      return files;
    };

    const matchingFiles = findFiles(process.cwd());

    if (matchingFiles.length === 0) {
      result.errors.push(`No files found matching pattern: ${pattern}`);
      return result;
    }

    logger.info(
      `Found ${matchingFiles.length} files matching pattern: ${pattern}`
    );

    // Sadece klasörleri sil, dosyaları değil
    const foldersToDelete = matchingFiles.filter((file) => {
      const fullPath = path.resolve(process.cwd(), file);
      return fs.statSync(fullPath).isDirectory();
    });

    return deleteMultipleFiles(foldersToDelete, options);
  } catch (error: any) {
    result.errors.push(`Error with pattern matching: ${error.message}`);
  }

  return result;
};
