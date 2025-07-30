"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("@testing-library/react-native");
describe("Component", () => {
    it("renders correctly", () => {
        const { getByText } = (0, react_native_1.render)(/>);
        expect(getByText("component")).toBeTruthy();
    });
});
