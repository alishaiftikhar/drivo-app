import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Color'; // 🎨 Color file (must be in correct path)

type InputButtonProps = TextInputProps & {
  showToggle?: boolean;
  secure?: boolean;
  onToggle?: () => void;
  isSecure?: boolean;
};

const InputButton = ({
  showToggle = false,
  secure = false,
  onToggle,
  isSecure,
  ...rest
}: InputButtonProps) => {
  return (
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        placeholderTextColor="black"
        secureTextEntry={secure && !isSecure}
        {...rest}
      />
      {showToggle && (
        <TouchableOpacity style={styles.eyeIcon} onPress={onToggle}>
          <Ionicons
            name={isSecure ? 'eye' : 'eye-off'}
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default InputButton;

const styles = StyleSheet.create({
  inputWrapper: {
    width: 300,
    justifyContent: 'center',
    marginVertical: 4,
  },
  input: {
    backgroundColor: Colors.text, // Light area (white)
    borderColor: Colors.primary,  // Dark blue border
    borderWidth: 3,
    borderRadius: 30,
    paddingHorizontal: 25,
    paddingVertical: 15,
    fontSize: 20,
    color: 'black', // Entered text will be black
  },
  eyeIcon: {
    position: 'absolute',
    right: 20,
    top: 18,
  },
});
