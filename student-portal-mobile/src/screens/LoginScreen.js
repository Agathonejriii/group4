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
import { loginUser } from '../api/config';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(username, password);
      console.log('✅ Login successful:', response);
      navigation.replace('MainTabs', { user: response.user || response });
    } catch (error) {
      Alert.alert('Login Failed', error.message);
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
      >
        {/* Top Section - Welcome Banner (Dark Blue) */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>University Logo</Text>
            </View>
            <Text style={styles.welcomeTitle}>
              Welcome to Your University Portal
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Access your courses, grades, and more securely.
            </Text>
          </View>
        </View>

        {/* Bottom Section - Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.formContent}>
            <Text style={styles.loginTitle}>Login</Text>
            <Text style={styles.loginSubtitle}>
              Please enter your university credentials to continue.
            </Text>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="agathonejriii"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Forgot your password?{' '}
                <Text style={styles.linkText}>Reset here</Text>
              </Text>
              <Text style={styles.divider}> | </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
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
  
  // Banner (Top Section) - Dark Blue Background
  bannerContainer: {
    backgroundColor: '#2c5282',
    paddingVertical: 60,
    paddingHorizontal: 30,
    minHeight: 300,
    justifyContent: 'center',
  },
  bannerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Form (Bottom Section)
  formContainer: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 40,
    paddingHorizontal: 30,
    flex: 1,
    justifyContent: 'center',
  },
  formContent: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
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
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a202c',
  },

  // Login Button
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  linkText: {
    color: '#2c5282',
    fontWeight: '600',
  },
  registerLink: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
});