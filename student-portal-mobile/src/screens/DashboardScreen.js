// src/screens/DashboardScreen.js - ALL 3 ROLES (Student, Admin, Lecturer)
import { memo, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth, logoutUser } from '../api/config';
import Button from '../components/Button';
import Card from '../components/Card';
import Colors from '../constants/colors';
import Typography from '../constants/typography';

// Role-based configuration
const ROLE_CONFIG = {
  student: {
    headerColor: Colors.primary,
    greetingIcon: '🎓',
    title: 'Student Dashboard',
    subtitle: 'Track your progress, generate reports, and connect with peers.',
    stats: [
      { key: 'achievements', label: 'Achievements', icon: '🎯', color: '#caffbf' },
      { key: 'projects', label: 'Projects', icon: '📁', color: '#9bf6ff' },
      { key: 'skills', label: 'Skills', icon: '💡', color: '#ffd6a5' },
      { key: 'awards', label: 'Awards', icon: '🏆', color: '#ffadad' },
    ],
    quickActions: [
      { title: 'View GPA', icon: '📊', screen: 'GPA', variant: 'primary' },
      { title: 'Register Courses', icon: '📚', screen: 'Courses', variant: 'secondary' },
      { title: 'View Profile', icon: '👤', screen: 'Profile', variant: 'outline' },
    ],
    sections: [
      {
        title: '📈 Recent Activity',
        content: 'Your recent achievements will appear here',
        actions: [
          { title: 'Add Achievement', icon: '➕', variant: 'outline' },
          { title: 'Generate Report', icon: '📊', variant: 'outline' },
        ],
      },
    ],
  },
  admin: {
    headerColor: Colors.dark,
    greetingIcon: '⚙️',
    title: 'Admin Dashboard',
    subtitle: 'Manage users, courses, and monitor system performance.',
    stats: [
      { key: 'total_users', label: 'Total Users', icon: '👥', color: '#caffbf' },
      { key: 'total_courses', label: 'Courses', icon: '📚', color: '#9bf6ff' },
      { key: 'total_reports', label: 'Reports', icon: '📊', color: '#ffd6a5' },
      { key: 'active_students', label: 'Active Students', icon: '🎓', color: '#ffadad' },
    ],
    quickActions: [
      { title: 'Add New User', icon: '👥', screen: 'AddUser', variant: 'primary' },
      { title: 'Generate Report', icon: '📊', screen: 'Reports', variant: 'secondary' },
      { title: 'Manage Users', icon: '🔧', screen: 'ManageUsers', variant: 'success' },
    ],
    sections: [
      {
        title: '📈 System Overview',
        content: 'Recent user activity will appear here',
        actions: [],
      },
    ],
  },
  lecturer: {
    headerColor: Colors.primary,
    greetingIcon: '👋',
    title: 'Lecturer Dashboard',
    subtitle: 'Manage your courses, assignments, and student progress.',
    stats: [
      { key: 'courses', label: 'Courses', icon: '📚', color: '#caffbf' },
      { key: 'assignments', label: 'Assignments', icon: '📋', color: '#9bf6ff' },
      { key: 'students', label: 'Students', icon: '👥', color: '#ffd6a5' },
      { key: 'pending_grading', label: 'Pending Grading', icon: '📝', color: '#ffadad' },
    ],
    quickActions: [
      { title: 'Add Course', icon: '➕', screen: 'AddCourse', variant: 'success' },
      { title: 'Add Assignment', icon: '➕', screen: 'AddAssignment', variant: 'primary' },
      { title: 'View Students', icon: '👥', screen: 'Students', variant: 'outline' },
    ],
    sections: [
      {
        title: '📚 Manage Courses',
        content: 'Your courses will appear here',
        actions: [
          { title: 'Add Course', icon: '➕', variant: 'success' },
        ],
      },
      {
        title: '📋 Manage Assignments',
        content: 'Your assignments will appear here',
        actions: [
          { title: 'Add Assignment', icon: '➕', variant: 'primary' },
        ],
      },
    ],
  },
};

// Header Component
const DashboardHeader = ({ user, onLogout }) => {
  const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.student;
  
  return (
    <View style={[styles.header, { backgroundColor: config.headerColor }]}>
      <View style={styles.headerContent}>
        <Text style={styles.greeting}>
          {config.greetingIcon} Hello, {user.username}!
        </Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={onLogout}
      >
        <Text style={styles.logoutIcon}>🚪</Text>
      </TouchableOpacity>
    </View>
  );
};

// Stats Grid Component
const StatsGrid = ({ stats, role }) => {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  
  return (
    <View style={styles.statsGrid}>
      {config.stats.map((stat) => (
        <View key={stat.key} style={styles.statCard}>
          <Card
            title={stat.label}
            value={stats[stat.key] || 0}
            icon={stat.icon}
            color={stat.color}
          />
        </View>
      ))}
    </View>
  );
};

// Section Component
const DashboardSection = ({ title, content, actions, onActionPress }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.activityCard}>
      <Text style={styles.activityText}>{content}</Text>
      {actions.length > 0 && (
        <View style={styles.quickActionsContainer}>
          {actions.map((action, index) => (
            <Button
              key={index}
              title={action.title}
              icon={action.icon}
              variant={action.variant}
              size="small"
              style={styles.quickActionBtn}
              onPress={() => onActionPress?.(action)}
            />
          ))}
        </View>
      )}
    </View>
  </View>
);

// Quick Actions Component
const QuickActions = ({ actions, onActionPress }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
    {actions.map((action, index) => (
      <Button
        key={index}
        title={action.title}
        icon={action.icon}
        variant={action.variant}
        onPress={() => onActionPress?.(action)}
        style={styles.actionButton}
      />
    ))}
  </View>
);

// Main Dashboard Component
const DashboardScreen = ({ route, navigation }) => {
  const { user } = route.params;
  const [stats, setStats] = useState({
    // Student stats
    achievements: 0,
    projects: 0,
    skills: 0,
    awards: 0,
    // Admin stats
    total_users: 0,
    total_courses: 0,
    total_reports: 0,
    active_students: 0,
    // Lecturer stats
    courses: 0,
    assignments: 0,
    students: 127,
    pending_grading: 8,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.student;

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const data = await fetchWithAuth('/accounts/dashboard-stats/');
      setStats(prevStats => ({
        ...prevStats,
        ...data,
      }));
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to load dashboard data');
      // Use default values on error (already set in initialState)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

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
            await logoutUser();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleActionPress = (action) => {
    if (action.screen) {
      // Navigate to the specified screen
      navigation.navigate(action.screen);
    } else {
      // Handle inline actions
      Alert.alert('Action', `${action.title} clicked - This feature is under development`);
    }
  };

  const handleQuickActionPress = (action) => {
    if (action.screen) {
      navigation.navigate(action.screen);
    } else {
      Alert.alert('Quick Action', `${action.title} clicked`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <Button
          title="Try Again"
          onPress={fetchDashboardData}
          variant="primary"
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header */}
      <DashboardHeader user={user} onLogout={handleLogout} />

      {/* Navigation Tabs */}
      <View style={styles.tabsCard}>
        <Text style={styles.tabsTitle}>📊 {config.title}</Text>
        <Text style={styles.tabsSubtitle}>
          {user.role === 'student' ? 'View your academic progress' : 
           user.role === 'admin' ? 'System Overview & Management' : 
           'Course & Assignment Management'}
        </Text>
      </View>

      {/* Stats Grid */}
      <StatsGrid stats={stats} role={user.role} />

      {/* Sections */}
      {config.sections.map((section, index) => (
        <DashboardSection
          key={index}
          title={section.title}
          content={section.content}
          actions={section.actions}
          onActionPress={handleActionPress}
        />
      ))}

      {/* Quick Actions */}
      <QuickActions 
        actions={config.quickActions} 
        onActionPress={handleQuickActionPress}
      />

      {/* Error Banner */}
      {error && (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    color: Colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  inlineError: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  inlineErrorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.danger,
  },
  
  // Header Styles
  header: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 16,
    lineHeight: 20,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  logoutButton: {
    padding: 8,
  },
  logoutIcon: {
    fontSize: 24,
  },

  // Tabs Card
  tabsCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark,
    marginBottom: 4,
  },
  tabsSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 20,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  
  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: 12,
  },
  
  // Activity Card
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray,
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickActionBtn: {
    flex: 1,
    marginBottom: 0,
  },
  
  // Action Buttons
  actionButton: {
    marginBottom: 12,
  },
});

export default memo(DashboardScreen);