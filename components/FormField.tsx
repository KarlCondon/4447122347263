import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { useAppTheme } from '../lib/theme';

type FormFieldProps = TextInputProps & {
  label: string;
};
// Shared input used across auth, logs, categories and targets screens
export default function FormField({
  label,
  style,
  multiline,
  ...props
}: FormFieldProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        multiline={multiline}
        placeholderTextColor={theme.textSoft}
        style={[styles.input, multiline && styles.multilineInput, style]}
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 14,
    },
    label: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      color: theme.text,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
    },
    multilineInput: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
  });