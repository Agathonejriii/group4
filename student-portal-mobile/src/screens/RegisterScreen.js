// src/screens/RegisterScreen.js - UPDATED WITH ENHANCED ERROR HANDLING
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { registerUser, testBackendConnection } from '../api/config';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const testConnectionBeforeRegister = async () => {
    try {
      console.log('🔍 Testing server connection before registration...');
      const isConnected = await testBackendConnection();
      if (!isConnected) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to server. Please check:\n\n• Django server is running\n• Correct IP address\n• Same WiFi network\n• Port 8000 is accessible',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      Alert.alert('Connection Test Failed', error.message);
      return false;
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // Test connection first
    const isConnected = await testConnectionBeforeRegister();
    if (!isConnected) return;

    setLoading(true);
    try {
      console.log('📝 Starting registration process...');
      
      const response = await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      console.log('✅ Registration successful, response:', response);
      
      Alert.alert(
        'Success 🎉',
        'Registration successful! You can now login with your credentials.',
        [
          {
            text: 'Go to Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );

      // Clear form on success
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
      });

    } catch (error) {
      console.error('❌ Registration error in screen:', error.message);
      
      // Provide more user-friendly error messages
      let userFriendlyMessage = error.message;
      
      if (error.message.includes('Server Error') || error.message.includes('Status: 500')) {
        userFriendlyMessage = 'Server error occurred. Please try again later or contact support.';
      } else if (error.message.includes('CSRF')) {
        userFriendlyMessage = 'Security verification failed. Please refresh the app and try again.';
      } else if (error.message.includes('Username already exists')) {
        userFriendlyMessage = 'This username is already taken. Please choose a different one.';
      } else if (error.message.includes('Email already exists')) {
        userFriendlyMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (error.message.includes('Network request failed')) {
        userFriendlyMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        userFriendlyMessage = 'Server is taking too long to respond. Please try again.';
      }

      Alert.alert(
        'Registration Failed',
        userFriendlyMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join the university portal to access your courses and grades
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              placeholder="Enter your username"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="your.email@university.edu"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Role Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role *</Text>
            <View style={styles.roleContainer}>
              {['student', 'lecturer', 'admin'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    formData.role === role && styles.roleButtonActive,
                    loading && styles.roleButtonDisabled,
                  ]}
                  onPress={() => !loading && handleInputChange('role', role)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      formData.role === role && styles.roleButtonTextActive,
                    ]}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="Re-enter your password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Connection Status */}
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionText}>
              Server: http://10.101.230.98:8000
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Debug Info (visible in development) */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Debug: Check console for detailed logs
              </Text>
            </View>
          )}

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={[styles.loginLink, loading && styles.linkDisabled]}>
                Login here
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // Header
  header: {
    backgroundColor: '#2c5282',
    paddingVertical: 50,
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },

  // Form
  formContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 30,
    paddingHorizontal: 30,
  },
  
  // Input Fields
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a202c',
  },

  // Role Selection
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d4d4d4',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#2c5282',
    backgroundColor: '#2c5282',
  },
  roleButtonDisabled: {
    opacity: 0.5,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#fff',
  },

  // Connection Info
  connectionInfo: {
    backgroundColor: '#e2e8f0',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 12,
    color: '#4a5568',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Register Button
  registerButton: {
    backgroundColor: '#2c5282',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Debug Info
  debugInfo: {
    backgroundColor: '#fed7d7',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#c53030',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#2c5282',
    fontWeight: '600',
  },
  linkDisabled: {
    opacity: 0.5,
  },
});