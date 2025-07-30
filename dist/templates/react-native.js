"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexContent = exports.ComponentStyleContent = exports.ComponentContent = void 0;
const ComponentContent = (name) => `
import React, { FC } from "react";
import { View, Text } from "react-native";
import {useTranslation} from 'react-i18next';

// Styles
import styles from "./${name}.Style";
import {useTheme} from '../../../theme/ThemeProvider';

// Components

type ${name}Props = {};

const ${name} = ({}) => {
    const {colors} = useTheme();
    const Style = styles();
    const {t} = useTranslation();

    return (
        <View style={Style.container}>
            <Text>${name}</Text>
        </View>
     );
    };

export default ${name};
`;
exports.ComponentContent = ComponentContent;
exports.ComponentStyleContent = `
import {StyleSheet} from 'react-native';
import {useTheme} from '../../../theme/ThemeProvider';
import {horizontalScale, verticalScale, moderateScale} from '../../../theme/metrics';

const styles = () => {
  const {colors} = useTheme();

  return StyleSheet.create({
    container:{},
  });
};

export default styles;

`;
const IndexContent = (name) => `
export { default } from "./${name}";
`;
exports.IndexContent = IndexContent;
