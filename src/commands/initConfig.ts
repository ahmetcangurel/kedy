import fs from "fs-extra";
import path from "path";
import { createSpinner } from "nanospinner";
import { logger } from "../utils/logger";

export const initConfig = () => {
  const spinner = createSpinner("Initializing kedy configuration...").start();

  try {
    const currentDir = process.cwd();

    // 1. kedy.config.js dosyasını oluştur
    const configTemplatePath = path.resolve(
      __dirname,
      "../../src/kedy-templates/kedy.config.js"
    );
    const configContent = fs.readFileSync(configTemplatePath, "utf8");
    const configPath = path.resolve(currentDir, "kedy.config.js");

    if (fs.existsSync(configPath)) {
      spinner.warn({ text: "kedy.config.js already exists. Skipping..." });
    } else {
      fs.writeFileSync(configPath, configContent, "utf8");
      spinner.success({ text: "kedy.config.js created successfully!" });
    }

    // 2. kedy-templates klasörünü oluştur
    const templatesDir = path.resolve(currentDir, "kedy-templates");
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // 3. Template dosyalarını kopyala
    const sourceTemplatesDir = path.resolve(
      __dirname,
      "../../src/kedy-templates"
    );
    const targetTemplatesDir = path.resolve(templatesDir);

    if (!fs.existsSync(targetTemplatesDir)) {
      fs.mkdirSync(targetTemplatesDir, { recursive: true });
    }

    // Template dosyalarını kopyala (kedy.config.js hariç)
    const templateFiles = [
      "component.template",
      "screen.template",
      "style.template",
      "test.template",
      "story.template",
    ];

    templateFiles.forEach((file) => {
      const sourcePath = path.resolve(sourceTemplatesDir, file);
      const targetPath = path.resolve(targetTemplatesDir, file);

      if (fs.existsSync(sourcePath)) {
        const content = fs.readFileSync(sourcePath, "utf8");
        fs.writeFileSync(targetPath, content, "utf8");
      }
    });

    spinner.success({ text: "Template files created successfully!" });

    // 4. Başarı mesajı
    console.log("\n🎉 Kedy configuration initialized successfully!");
    console.log("📁 Created files:");
    console.log("   - kedy.config.js");
    console.log("   - kedy-templates/");
    console.log("\n🚀 You can now use:");
    console.log("   npx kedy make:screen <name>");
    console.log("   npx kedy make:component <name>");
  } catch (error: any) {
    spinner.error({
      text: `Failed to initialize configuration: ${error.message}`,
    });
    logger.error(error);
  }
};
