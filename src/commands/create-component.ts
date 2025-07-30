import fs from "fs";
import path from "path";
import { createSpinner } from "nanospinner";
import { loadConfig } from "../utils/configLoader";
import { generateFile, processTemplate } from "../utils/fileGenerator";
import { logger } from "../utils/logger";
import { capitalize } from "../utils/capitalize";

export const createComponent = (
  name: string,
  options: {
    style?: boolean;
    index?: boolean;
    test?: boolean;
    component?: boolean;
  },
  type: "screen" | "component" = "screen"
) => {
  const config = loadConfig();
  // Support both ":" and "/" separators for nested folders
  let folder: string | null = null;
  let componentName: string = name;
  
  if (name.includes(":")) {
    [folder, componentName] = name.split(":");
  } else if (name.includes("/")) {
    [folder, componentName] = name.split("/");
  }

  // Type'a göre path ve naming convention belirle
  let basePath: string;
  if (folder) {
    // Klasör adı varsa: screens/Main/Dashboard/
    basePath = path.join(
      type === "screen" ? config.paths.screens : config.paths.components,
      capitalize(folder),
      capitalize(componentName)
    );
  } else {
    // Klasör adı yoksa: screens/Home/
    basePath = path.join(
      type === "screen" ? config.paths.screens : config.paths.components,
      capitalize(componentName)
    );
  }

  const componentFileName =
    type === "screen"
      ? config.namingConvention.screen(capitalize(componentName))
      : config.namingConvention.component(capitalize(componentName));

  const fullPath = path.join(
    basePath,
    `${componentFileName}.${config.language === "typescript" ? "tsx" : "jsx"}`
  );

  const spinner = createSpinner(
    `Creating ${type}: ${componentFileName}`
  ).start();

  try {
    fs.mkdirSync(basePath, { recursive: true });

    // Template içeriğini oluştur
    let templateContent: string;
    const templatePath =
      type === "screen" ? config.templates.screen : config.templates.component;

    if (templatePath) {
      templateContent = processTemplate(templatePath, componentName);
    } else {
      // Fallback template
      templateContent = `import React from 'react';
import { View, Text } from 'react-native';

const ${componentFileName} = () => {
  return (
    <View>
      <Text>${componentFileName}</Text>
    </View>
  );
};

export default ${componentFileName};`;
    }

    generateFile(fullPath, templateContent);

    // Style dosyası oluştur
    if (options.style ?? config.defaults.withStyle) {
      const stylePath = path.join(
        basePath,
        `${config.namingConvention.style(capitalize(componentName))}.${
          config.language === "typescript" ? "ts" : "js"
        }`
      );

      let styleContent: string;
      if (config.templates.style) {
        styleContent = processTemplate(config.templates.style, componentName);
      } else {
        styleContent = `import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});`;
      }

      generateFile(stylePath, styleContent);
    }

    // Test dosyası oluştur
    if (options.test ?? config.defaults.withTest) {
      const testPath = path.join(
        basePath,
        `${config.namingConvention.test(capitalize(componentName))}.${
          config.language === "typescript" ? "ts" : "js"
        }`
      );

      let testContent: string;
      if (config.templates.test) {
        testContent = processTemplate(config.templates.test, componentName);
      } else {
        testContent = `import React from 'react';
import { render } from '@testing-library/react-native';
import ${componentFileName} from './${componentFileName}';

describe('${componentFileName}', () => {
  it('renders correctly', () => {
    const { getByText } = render(<${componentFileName} />);
    expect(getByText('${componentFileName}')).toBeTruthy();
  });
});`;
      }

      generateFile(testPath, testContent);
    }

    // Index dosyası oluştur
    if (options.index ?? config.defaults.withIndex) {
      const indexPath = path.join(
        basePath,
        `index.${config.language === "typescript" ? "ts" : "js"}`
      );
      generateFile(
        indexPath,
        `export { default } from './${componentFileName}';\n`
      );
    }

    spinner.success({
      text: `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } ${componentFileName} created successfully!`,
    });
  } catch (error: any) {
    spinner.error({ text: `Failed to create ${type}: ${error.message}` });
    logger.error(error);
  }
};
