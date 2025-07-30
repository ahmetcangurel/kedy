"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = exports.component = void 0;
const component = (name) => {
    return `import React from 'react';
  
export function ${name}() {
  return (
    <div>
      <h1>${name}</h1>
    </div>
  );
}
`;
};
exports.component = component;
const test = (name) => {
    return `import React from 'react';
import { render } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('should render', () => {
    render(<${name} />);
  });
});
`;
};
exports.test = test;
