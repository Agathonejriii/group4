import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { getUser, logoutUser } from '../api/config';
import Button from '../components/Button';
import Colors from '../constants/colors';
import Typography from '../constants/typography';

export default function ProfileScreen({ navigation, route }) {
  const { user: initialUser } = route.params;
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await getUser();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await logoutUser();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user.username?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Profile Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>
              {user.department || 'Not set'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Year</Text>
            <Text style={styles.infoValue}>
              {user.year || 'Not set'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bio</Text>
            <Text style={[styles.infoValue, styles.bioText]}>
              {user.bio || 'No bio added yet'}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Settings</Text>
        
        <Button
          title="Edit Profile"
          icon="✏️"
          variant="outline"
          onPress={() => Alert.alert('Coming Soon', 'Edit profile feature')}
          style={styles.actionButton}
        />
        
        <Button
          title="Change Password"
          icon="🔒"
          variant="outline"
          onPress={() => Alert.alert('Coming Soon', 'Change password feature')}
          style={styles.actionButton}
        />
        
        <Button
          title="Logout"
          icon="🚪"
          variant="danger"
          onPress={handleLogout}
          loading={loading}
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },
  username: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: 4,
  },
  email: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.dark,
    fontWeight: Typography.fontWeight.medium,
  },
  bioText: {
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.grayLight,
  },
  actionButton: {
    marginBottom: 12,
  },
});