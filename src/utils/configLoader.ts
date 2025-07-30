import fs from "fs";
import path from "path";

export const loadConfig = () => {
  const configPath = path.resolve(process.cwd(), "kedy.config.js");
  if (fs.existsSync(configPath)) {
    return require(configPath);
  }
  return {
    paths: {
      screens: "src/Screens",
      components: "src/Components",
    },
    defaults: {
      withStyle: true,
      withIndex: true,
      withTest: true,
    },
    namingConvention: {
      screen: (name: string) => `${name}Screen`,
      style: (name: string) => `${name}Screen.Style`,
    },
    language: "typescript",
    templates: {},
  };
};
