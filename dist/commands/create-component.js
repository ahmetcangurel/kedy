"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComponent = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const nanospinner_1 = require("nanospinner");
const configLoader_1 = require("../utils/configLoader");
const fileGenerator_1 = require("../utils/fileGenerator");
const logger_1 = require("../utils/logger");
const capitalize_1 = require("../utils/capitalize");
const createComponent = (name, options, type = "screen") => {
    var _a, _b, _c;
    const config = (0, configLoader_1.loadConfig)();
    // Support both ":" and "/" separators for nested folders
    let folder = null;
    let componentName = name;
    if (name.includes(":")) {
        [folder, componentName] = name.split(":");
    }
    else if (name.includes("/")) {
        [folder, componentName] = name.split("/");
    }
    // Type'a göre path ve naming convention belirle
    let basePath;
    if (folder) {
        // Klasör adı varsa: screens/Main/Dashboard/
        basePath = path_1.default.join(type === "screen" ? config.paths.screens : config.paths.components, (0, capitalize_1.capitalize)(folder), (0, capitalize_1.capitalize)(componentName));
    }
    else {
        // Klasör adı yoksa: screens/Home/
        basePath = path_1.default.join(type === "screen" ? config.paths.screens : config.paths.components, (0, capitalize_1.capitalize)(componentName));
    }
    const componentFileName = type === "screen"
        ? config.namingConvention.screen((0, capitalize_1.capitalize)(componentName))
        : config.namingConvention.component((0, capitalize_1.capitalize)(componentName));
    const fullPath = path_1.default.join(basePath, `${componentFileName}.${config.language === "typescript" ? "tsx" : "jsx"}`);
    const spinner = (0, nanospinner_1.createSpinner)(`Creating ${type}: ${componentFileName}`).start();
    try {
        fs_1.default.mkdirSync(basePath, { recursive: true });
        // Template içeriğini oluştur
        let templateContent;
        const templatePath = type === "screen" ? config.templates.screen : config.templates.component;
        if (templatePath) {
            templateContent = (0, fileGenerator_1.processTemplate)(templatePath, componentName);
        }
        else {
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
        (0, fileGenerator_1.generateFile)(fullPath, templateContent);
        // Style dosyası oluştur
        if ((_a = options.style) !== null && _a !== void 0 ? _a : config.defaults.withStyle) {
            const stylePath = path_1.default.join(basePath, `${config.namingConvention.style((0, capitalize_1.capitalize)(componentName))}.${config.language === "typescript" ? "ts" : "js"}`);
            let styleContent;
            if (config.templates.style) {
                styleContent = (0, fileGenerator_1.processTemplate)(config.templates.style, componentName);
            }
            else {
                styleContent = `import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});`;
            }
            (0, fileGenerator_1.generateFile)(stylePath, styleContent);
        }
        // Test dosyası oluştur
        if ((_b = options.test) !== null && _b !== void 0 ? _b : config.defaults.withTest) {
            const testPath = path_1.default.join(basePath, `${config.namingConvention.test((0, capitalize_1.capitalize)(componentName))}.${config.language === "typescript" ? "ts" : "js"}`);
            let testContent;
            if (config.templates.test) {
                testContent = (0, fileGenerator_1.processTemplate)(config.templates.test, componentName);
            }
            else {
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
            (0, fileGenerator_1.generateFile)(testPath, testContent);
        }
        // Index dosyası oluştur
        if ((_c = options.index) !== null && _c !== void 0 ? _c : config.defaults.withIndex) {
            const indexPath = path_1.default.join(basePath, `index.${config.language === "typescript" ? "ts" : "js"}`);
            (0, fileGenerator_1.generateFile)(indexPath, `export { default } from './${componentFileName}';\n`);
        }
        spinner.success({
            text: `${type.charAt(0).toUpperCase() + type.slice(1)} ${componentFileName} created successfully!`,
        });
    }
    catch (error) {
        spinner.error({ text: `Failed to create ${type}: ${error.message}` });
        logger_1.logger.error(error);
    }
};
exports.createComponent = createComponent;
