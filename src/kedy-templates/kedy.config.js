module.exports = {
  paths: {
    screens: "src/screens",
    components: "src/components",
  },
  defaults: {
    withStyle: true,
    withIndex: true,
    withTest: false,
    withStory: false,
  },
  namingConvention: {
    component: (name) => `${name}`,
    screen: (name) => `${name}Screen`,
    style: (name) => `${name}.Styles`,
    test: (name) => `${name}.test`,
    story: (name) => `${name}.stories`,
  },
  templates: {
    component: "kedy-templates/component.template",
    screen: "kedy-templates/screen.template",
    style: "kedy-templates/style.template",
    test: "kedy-templates/test.template",
    story: "kedy-templates/story.template",
  },
  // Import analysis settings
  importAnalysis: {
    // File extensions to scan
    fileExtensions: [".tsx", ".ts", ".jsx", ".js"],
    // Folders to scan
    scanFolders: ["src"],
    // Auto-fix unused imports (true/false)
    autoFix: false,
    // Detailed report (true/false)
    detailedReport: true,
    // Files/folders to exclude
    excludeFiles: ["node_modules", "dist", "build"],
  },
};
