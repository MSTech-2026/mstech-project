import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

/**
 * Atmospheric background used across screens: a thin amber rule at the top edge.
 * Purely decorative and non-interactive. Rendered behind content.
 */
export function Atmosphere() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.topRule} />
    </View>
  );
}

const styles = StyleSheet.create({
  topRule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
});
