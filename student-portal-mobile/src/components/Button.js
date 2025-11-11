import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';

export default function Button({ 
  title, 
  onPress, 
  loading, 
  variant = 'primary', 
  size = 'medium',
  icon,
  style, 
  disabled 
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? Colors.primary : Colors.white} 
          size="small"
        />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[
            styles.text, 
            styles[`${variant}Text`], 
            styles[`${size}Text`]
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  success: {
    backgroundColor: Colors.success,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  
  disabled: {
    opacity: 0.6,
  },
  
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.white,
    fontSize: 16,
  },
  secondaryText: {
    color: Colors.white,
    fontSize: 16,
  },
  successText: {
    color: Colors.white,
    fontSize: 16,
  },
  dangerText: {
    color: Colors.white,
    fontSize: 16,
  },
  outlineText: {
    color: Colors.primary,
    fontSize: 16,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});