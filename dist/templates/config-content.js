"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configContent = void 0;
exports.configContent = `
module.exports = {
  paths: {
    screens: 'src/screens',
    components: 'src/components',
  },
  defaults: {
    withStyle: true,
    withIndex: true,
  },
  namingConvention: {
    screen: (name) => \`\${name}Screen\`,
    style: (name) => \`\${name}Screen.Style\`,
  },
  language: 'typescript', // or 'javascript'
  templates: {
    screen: (name) => \`import React from 'react';\n\nconst \${name}Screen = () => {\n  return <div>Welcome to \${name}Screen</div>;\n};\n\nexport default \${name}Screen;\`,
  },
};
    `;
