import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

// Import screens
import CourseRegistrationScreen from '../screens/CourseRegistrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GPAScreen from '../screens/GPAScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SemesterRegistrationScreen from '../screens/SemesterRegistrationScreen';

import Colors from '../constants/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main app screens
function MainTabs({ route }) {
  const { user } = route.params;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.grayLight,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.dark,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="GPA"
        component={GPAScreen}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📊</Text>,
          title: 'GPA Calculator',
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CourseRegistrationScreen}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📚</Text>,
          title: 'Course Registration',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
          title: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Main Navigation Stack
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen 
          name="SemesterRegistration" 
          component={SemesterRegistrationScreen}
          options={{
            headerShown: true,
            title: 'Register Semester',
            headerStyle: {
              backgroundColor: Colors.primary,
            },
            headerTintColor: Colors.dark,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}