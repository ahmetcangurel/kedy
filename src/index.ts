import { program } from "commander";
import { initConfig } from "./commands/initConfig";
import { createComponent } from "./commands/create-component";
import { fixImports } from "./commands/fix-imports";
import { findUnused } from "./commands/find-unused";
import { deleteScreen } from "./commands/delete-screen";
import { deleteComponent } from "./commands/delete-component";
import { analyzeProjectCommand } from "./commands/analyze-project";

program
  .name("kedy")
  .description(
    "A CLI tool for automating React Native folder and file creation."
  )
  .version("1.0.0");

program
  .command("init:config")
  .description("Generate a default kedy.config.js file")
  .action(initConfig);

program
  .command("make:screen <name>")
  .description("Create a new screen with optional folder structure")
  .option("-s, --style", "Include a style file")
  .option("-i, --index", "Include an index file")
  .option("-t, --test", "Include a test file")
  .option("-c, --component", "Include a component file")
  .action((name, options) => {
    createComponent(name, options, "screen");
  });

program
  .command("make:component <name>")
  .description("Create a new component with optional folder structure")
  .option("-s, --style", "Include a style file")
  .option("-i, --index", "Include an index file")
  .option("-t, --test", "Include a test file")
  .option("-c, --component", "Include a component file")
  .action((name, options) => {
    createComponent(name, options, "component");
  });

program
  .command("fix:imports")
  .description("Analyze and fix unused imports")
  .option("-a, --auto-fix", "Automatically fix unused imports")
  .option("-d, --detailed", "Show detailed report")
  .action((options) => {
    fixImports(options);
  });

program
  .command("find:unused")
  .description("Find unused files in the project")
  .option("-d, --detailed", "Show detailed report")
  .option("--delete", "Delete unused files")
  .action((options) => {
    findUnused(options);
  });

program
  .command("delete:screen <name>")
  .description("Delete a screen")
  .option("-f, --force", "Force deletion")
  .option("-b, --backup", "Create backup before deletion")
  .option("-p, --pattern", "Use pattern matching")
  .option("-r, --recursive", "Delete recursively")
  .action((name, options) => {
    deleteScreen(name, options);
  });

program
  .command("delete:component <name>")
  .description("Delete a component")
  .option("-f, --force", "Force deletion")
  .option("-b, --backup", "Create backup before deletion")
  .option("-p, --pattern", "Use pattern matching")
  .option("-r, --recursive", "Delete recursively")
  .action((name, options) => {
    deleteComponent(name, options);
  });

program
  .command("analyze:project")
  .description("Analyze project structure and code quality")
  .option("-d, --detailed", "Show detailed analysis")
  .option("-s, --screens-only", "Analyze only screens")
  .option("-c, --components-only", "Analyze only components")
  .option("-q, --quality-only", "Show only quality metrics")
  .option("--json", "Output in JSON format")
  .option("--html", "Generate HTML report")
  // Yeni analiz seçenekleri
  .option("--performance", "Include performance analysis")
  .option("--architecture", "Include architecture analysis")
  .option("--testing", "Include testing analysis")
  .option("--security", "Include security analysis")
  .option("--react-native", "Include React Native specific analysis")
  .option("--all", "Include all analysis types")
  .action((options) => {
    analyzeProjectCommand(options);
  });

program.parse(process.argv);
