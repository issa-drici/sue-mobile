import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const VOLT_COLOR = '#D4FC79';

interface OtpCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  /** Appelé dès que les 6 chiffres sont saisis (ou remplis par iOS depuis le SMS) */
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
}

/** Code SMS à 6 chiffres, mêmes cases que l'écran de connexion */
export function OtpCodeInput({ value, onChange, onComplete, autoFocus = true }: OtpCodeInputProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const handleChange = (text: string) => {
    const code = text.replace(/\D/g, '').slice(0, 6);
    onChange(code);
    if (code.length === 6) onComplete?.(code);
  };

  return (
    <View>
      <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.row}>
        {Array.from({ length: 6 }, (_, idx) => (
          <View key={idx} style={[styles.box, idx === value.length && styles.boxFocused]}>
            <Text style={styles.digit}>{value[idx] || ''}</Text>
          </View>
        ))}
      </TouchableOpacity>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        caretHidden
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxFocused: {
    borderColor: VOLT_COLOR,
  },
  digit: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
});
