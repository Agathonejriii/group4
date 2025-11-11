import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';

export default function Card({ 
  title, 
  value, 
  icon, 
  color = Colors.cardGreen,
  onPress,
  style 
}) {
  const CardContainer = onPress ? TouchableOpacity : View;
  
  return (
    <CardContainer 
      style={[styles.card, { backgroundColor: color }, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 140,
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },
});
