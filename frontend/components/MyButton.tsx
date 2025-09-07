import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import Color from '@/constants/Color';

interface MyButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[]; // Allow single or array of styles from outside
  disabled?: boolean;              // Optional disabled prop to control button state
}

const MyButton = ({ title, onPress, style, disabled = false }: MyButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabledButton]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, disabled && styles.disabledText]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Color.primary,
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: Color.text,
    shadowOffset: { width: 4, height: 7 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    alignSelf: 'center', // Centered by default
  },
  disabledButton: {
    backgroundColor: '#999999',
  },
  buttonText: {
    color: Color.text,
    fontSize: 22,
    fontWeight: '600',
  },
  disabledText: {
    color: '#dddddd',
  },
});

export default MyButton;
