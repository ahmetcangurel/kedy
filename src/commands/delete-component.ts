import { createSpinner } from "nanospinner";
import { loadConfig } from "../utils/configLoader";
import { logger } from "../utils/logger";
import {
  deleteFileOrFolder,
  deleteMultipleFiles,
  deleteByPattern,
  DeleteOptions,
} from "../utils/fileDeleter";

export const deleteComponent = (
  componentName: string,
  options: {
    force?: boolean;
    backup?: boolean;
    pattern?: boolean;
    recursive?: boolean;
  }
) => {
  const spinner = createSpinner("Deleting component...").start();

  try {
    const config = loadConfig();
    const { components } = config.paths;

    let targetPath: string;
    let deleteOptions: DeleteOptions = {
      force: options.force,
      backup: options.backup,
      recursive: options.recursive || true,
    };

    if (options.pattern) {
      // Pattern-based deletion
      const pattern = componentName;
      const result = deleteByPattern(pattern, deleteOptions);

      if (result.success) {
        spinner.success({ text: "Components deleted successfully!" });

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
        spinner.error({ text: "Failed to delete components" });
        console.log("\n❌ Errors:");
        result.errors.forEach((error) => {
          console.log(`   ${error}`);
        });
      }

      return;
    }

    // Normal component deletion
    if (componentName.includes("/") || componentName.includes(":")) {
      // Parse nested path (e.g., "ui/Modal" -> "Ui/Modal" or "ui:Modal" -> "Ui/Modal")
      const separator = componentName.includes("/") ? "/" : ":";
      const pathParts = componentName.split(separator);
      const capitalizedParts = pathParts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      );
      targetPath = `${components}/${capitalizedParts.join("/")}`;
    } else {
      // Just component name, construct path
      targetPath = `${components}/${componentName}`;
    }

    const result = deleteFileOrFolder(targetPath, deleteOptions);

    if (result.success) {
      spinner.success({ text: "Component deleted successfully!" });

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
      spinner.error({ text: "Failed to delete component" });
      console.log("\n❌ Errors:");
      result.errors.forEach((error) => {
        console.log(`   ${error}`);
      });
    }
  } catch (error: any) {
    spinner.error({ text: `Failed to delete component: ${error.message}` });
    logger.error(error);
  }
};
