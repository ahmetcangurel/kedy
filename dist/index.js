#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const initConfig_1 = require("./commands/initConfig");
const create_component_1 = require("./commands/create-component");
const fix_imports_1 = require("./commands/fix-imports");
const find_unused_1 = require("./commands/find-unused");
const delete_screen_1 = require("./commands/delete-screen");
const delete_component_1 = require("./commands/delete-component");
const analyze_project_1 = require("./commands/analyze-project");
commander_1.program
    .name("kedy")
    .description("A CLI tool for automating React Native folder and file creation.")
    .version("1.0.0");
commander_1.program
    .command("init:config")
    .description("Generate a default kedy.config.js file")
    .action(initConfig_1.initConfig);
commander_1.program
    .command("make:screen <name>")
    .description("Create a new screen with optional folder structure")
    .option("-s, --style", "Include a style file")
    .option("-i, --index", "Include an index file")
    .option("-t, --test", "Include a test file")
    .option("-c, --component", "Include a component file")
    .action((name, options) => {
    (0, create_component_1.createComponent)(name, options, "screen");
});
commander_1.program
    .command("make:component <name>")
    .description("Create a new component with optional folder structure")
    .option("-s, --style", "Include a style file")
    .option("-i, --index", "Include an index file")
    .option("-t, --test", "Include a test file")
    .option("-c, --component", "Include a component file")
    .action((name, options) => {
    (0, create_component_1.createComponent)(name, options, "component");
});
commander_1.program
    .command("fix:imports")
    .description("Analyze and fix unused imports")
    .option("-a, --auto-fix", "Automatically fix unused imports")
    .option("-d, --detailed", "Show detailed report")
    .action((options) => {
    (0, fix_imports_1.fixImports)(options);
});
commander_1.program
    .command("find:unused")
    .description("Find unused files in the project")
    .option("-d, --detailed", "Show detailed report")
    .option("--delete", "Delete unused files")
    .action((options) => {
    (0, find_unused_1.findUnused)(options);
});
commander_1.program
    .command("delete:screen <name>")
    .description("Delete a screen")
    .option("-f, --force", "Force deletion")
    .option("-b, --backup", "Create backup before deletion")
    .option("-p, --pattern", "Use pattern matching")
    .option("-r, --recursive", "Delete recursively")
    .action((name, options) => {
    (0, delete_screen_1.deleteScreen)(name, options);
});
commander_1.program
    .command("delete:component <name>")
    .description("Delete a component")
    .option("-f, --force", "Force deletion")
    .option("-b, --backup", "Create backup before deletion")
    .option("-p, --pattern", "Use pattern matching")
    .option("-r, --recursive", "Delete recursively")
    .action((name, options) => {
    (0, delete_component_1.deleteComponent)(name, options);
});
commander_1.program
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
    (0, analyze_project_1.analyzeProjectCommand)(options);
});
commander_1.program.parse(process.argv);
