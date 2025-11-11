import { StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';

export default function Input({
  label,
  error,
  icon,
  style,
  containerStyle,
  ...props
}) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={[
            styles.input, 
            icon && styles.inputWithIcon,
            error && styles.inputError,
            style
          ]}
          placeholderTextColor={Colors.gray}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.dark,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grayLight,
    borderRadius: 10,
    padding: 15,
    fontSize: Typography.fontSize.md,
    color: Colors.dark,
  },
  inputWithIcon: {
    paddingLeft: 45,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
});
