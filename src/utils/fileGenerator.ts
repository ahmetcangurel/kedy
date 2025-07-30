import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";

export const generateFile = (filePath: string, content: string) => {
  if (fs.existsSync(filePath)) {
    return logger.error(`File already exists: ${filePath}`);
  }

  return fs.writeFileSync(filePath, content, "utf8");
};

export const processTemplate = (templatePath: string, name: string): string => {
  try {
    const fullPath = path.resolve(process.cwd(), templatePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    let content = fs.readFileSync(fullPath, "utf8");

    // Template değişkenlerini değiştir
    content = content.replace(/\{\{name\}\}/g, name);
    content = content.replace(
      /\{\{Name\}\}/g,
      name.charAt(0).toUpperCase() + name.slice(1)
    );

    return content;
  } catch (error: any) {
    logger.error(`Error processing template: ${error.message}`);
    throw error;
  }
};
