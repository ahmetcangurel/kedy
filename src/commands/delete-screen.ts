import { createSpinner } from "nanospinner";
import { loadConfig } from "../utils/configLoader";
import { logger } from "../utils/logger";
import {
  deleteFileOrFolder,
  deleteMultipleFiles,
  deleteByPattern,
  DeleteOptions,
} from "../utils/fileDeleter";

export const deleteScreen = (
  screenName: string,
  options: {
    force?: boolean;
    backup?: boolean;
    pattern?: boolean;
    recursive?: boolean;
  }
) => {
  const spinner = createSpinner("Deleting screen...").start();

  try {
    const config = loadConfig();
    const { screens } = config.paths;

    let targetPath: string;
    let deleteOptions: DeleteOptions = {
      force: options.force,
      backup: options.backup,
      recursive: options.recursive || true,
    };

    if (options.pattern) {
      // Pattern-based deletion
      const pattern = screenName;
      const result = deleteByPattern(pattern, deleteOptions);

      if (result.success) {
        spinner.success({ text: "Screens deleted successfully!" });

        console.log("\n📊 Deletion Summary:");
        console.log(`🗑️  Deleted files: ${result.deletedFiles.length}`);
        console.log(`📁 Deleted folders: ${result.deletedFolders.length}`);
        console.log(
          `💾 Total size freed: ${(result.totalSize / 1024).toFixed(2)} KB`
        );

        if (result.deletedFiles.length > 0) {
          console.log("\n📄 Deleted Files:");
          result.deletedFiles.forEach((file) => {
            console.log(`   ✅ ${file}`);
          });
        }

        if (result.deletedFolders.length > 0) {
          console.log("\n📁 Deleted Folders:");
          result.deletedFolders.forEach((folder) => {
            console.log(`   ✅ ${folder}`);
          });
        }
      } else {
        spinner.error({ text: "Failed to delete screens" });
        console.log("\n❌ Errors:");
        result.errors.forEach((error) => {
          console.log(`   ${error}`);
        });
      }

      return;
    }

    // Normal screen deletion
    if (screenName.includes("/") || screenName.includes(":")) {
      // Parse nested path (e.g., "test/Profile" -> "Test/Profile" or "test:Profile" -> "Test/Profile")
      const separator = screenName.includes("/") ? "/" : ":";
      const pathParts = screenName.split(separator);
      const capitalizedParts = pathParts.map(
        (part) => part.charAt(0).toUpperCase() + part.slice(1)
      );
      targetPath = `${screens}/${capitalizedParts.join("/")}`;
    } else {
      // Just screen name, construct path
      targetPath = `${screens}/${screenName}`;
    }

    const result = deleteFileOrFolder(targetPath, deleteOptions);

    if (result.success) {
      spinner.success({ text: "Screen deleted successfully!" });

      console.log("\n📊 Deletion Summary:");
      console.log(`🗑️  Deleted files: ${result.deletedFiles.length}`);
      console.log(`📁 Deleted folders: ${result.deletedFolders.length}`);
      console.log(
        `💾 Total size freed: ${(result.totalSize / 1024).toFixed(2)} KB`
      );

      if (result.deletedFiles.length > 0) {
        console.log("\n📄 Deleted Files:");
        result.deletedFiles.forEach((file) => {
          console.log(`   ✅ ${file}`);
        });
      }

      if (result.deletedFolders.length > 0) {
        console.log("\n📁 Deleted Folders:");
        result.deletedFolders.forEach((folder) => {
          console.log(`   ✅ ${folder}`);
        });
      }
    } else {
      spinner.error({ text: "Failed to delete screen" });
      console.log("\n❌ Errors:");
      result.errors.forEach((error) => {
        console.log(`   ${error}`);
      });
    }
  } catch (error: any) {
    spinner.error({ text: `Failed to delete screen: ${error.message}` });
    logger.error(error);
  }
};
