import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { registerForSemester, fetchAvailableCourses } from '../api/config';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Colors from '../constants/colors';

export default function SemesterRegistrationScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [customCourse, setCustomCourse] = useState({ code: '', name: '', credits: '' });

  // Predefined common courses
  const commonCourses = [
    { code: 'CS101', name: 'Introduction to Computer Science', credits: 3 },
    { code: 'CS201', name: 'Data Structures', credits: 4 },
    { code: 'CS301', name: 'Algorithms', credits: 4 },
    { code: 'MATH101', name: 'Calculus I', credits: 3 },
    { code: 'MATH201', name: 'Linear Algebra', credits: 3 },
    { code: 'ENG101', name: 'English Composition', credits: 3 },
    { code: 'PHY101', name: 'Physics I', credits: 4 },
    { code: 'CHEM101', name: 'Chemistry I', credits: 4 },
  ];

  const toggleCourse = (course) => {
    const exists = selectedCourses.find(c => c.code === course.code);
    if (exists) {
      setSelectedCourses(selectedCourses.filter(c => c.code !== course.code));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const addCustomCourse = () => {
    if (!customCourse.code || !customCourse.name || !customCourse.credits) {
      Alert.alert('Error', 'Please fill in all course details');
      return;
    }

    const exists = selectedCourses.find(c => c.code === customCourse.code);
    if (exists) {
      Alert.alert('Error', 'Course already added');
      return;
    }

    setSelectedCourses([...selectedCourses, {
      code: customCourse.code,
      name: customCourse.name,
      credits: parseInt(customCourse.credits),
    }]);

    setCustomCourse({ code: '', name: '', credits: '' });
    Alert.alert('Success', 'Course added to your selection');
  };

  const handleSubmit = async () => {
    if (!semester || !year) {
      Alert.alert('Error', 'Please enter semester and year');
      return;
    }

    if (selectedCourses.length === 0) {
      Alert.alert('Error', 'Please select at least one course');
      return;
    }

    const totalCredits = selectedCourses.reduce((sum, course) => sum + course.credits, 0);

    Alert.alert(
      'Confirm Registration',
      `Semester: ${semester}\nYear: ${year}\nCourses: ${selectedCourses.length}\nTotal Credits: ${totalCredits}\n\nProceed with registration?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: async () => {
            setSubmitting(true);
            try {
              await registerForSemester({
                semester,
                year,
                courses: selectedCourses,
                total_credits: totalCredits,
              });
              Alert.alert(
                'Success!',
                'Semester registration completed successfully',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Registration Failed', error.message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const totalCredits = selectedCourses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Semester Registration</Text>
        <Text style={styles.headerSubtitle}>Register for courses this semester</Text>
      </View>

      {/* Semester Details */}
      <Card>
        <Text style={styles.cardTitle}>📅 Semester Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Semester (e.g., 1, 2)"
          value={semester}
          onChangeText={setSemester}
          keyboardType="number-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Year (e.g., 2024)"
          value={year}
          onChangeText={setYear}
          keyboardType="number-pad"
        />
      </Card>

      {/* Selected Courses Summary */}
      {selectedCourses.length > 0 && (
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>📋 Selected Courses</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Courses:</Text>
            <Text style={styles.summaryValue}>{selectedCourses.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Credits:</Text>
            <Text style={styles.summaryValue}>{totalCredits}</Text>
          </View>
        </Card>
      )}

      {/* Available Courses */}
      <Card>
        <Text style={styles.cardTitle}>📚 Select Courses</Text>
        <Text style={styles.sectionSubtitle}>Choose from available courses</Text>
        {commonCourses.map((course) => {
          const isSelected = selectedCourses.find(c => c.code === course.code);
          return (
            <TouchableOpacity
              key={course.code}
              style={[styles.courseItem, isSelected && styles.courseItemSelected]}
              onPress={() => toggleCourse(course)}
            >
              <View style={styles.courseInfo}>
                <Text style={[styles.courseCode, isSelected && styles.courseCodeSelected]}>
                  {course.code}
                </Text>
                <Text style={[styles.courseName, isSelected && styles.courseNameSelected]}>
                  {course.name}
                </Text>
              </View>
              <View style={styles.courseCredits}>
                <Text style={[styles.creditsText, isSelected && styles.creditsTextSelected]}>
                  {course.credits} CR
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* Add Custom Course */}
      <Card>
        <Text style={styles.cardTitle}>➕ Add Custom Course</Text>
        <TextInput
          style={styles.input}
          placeholder="Course Code (e.g., CS401)"
          value={customCourse.code}
          onChangeText={(value) => setCustomCourse({...customCourse, code: value})}
          autoCapitalize="characters"
        />
        <TextInput
          style={styles.input}
          placeholder="Course Name"
          value={customCourse.name}
          onChangeText={(value) => setCustomCourse({...customCourse, name: value})}
        />
        <TextInput
          style={styles.input}
          placeholder="Credits (e.g., 3)"
          value={customCourse.credits}
          onChangeText={(value) => setCustomCourse({...customCourse, credits: value})}
          keyboardType="number-pad"
        />
        <Button
          title="Add Course"
          variant="outline"
          onPress={addCustomCourse}
        />
      </Card>

      {/* Selected Courses List */}
      {selectedCourses.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>✅ Your Selected Courses</Text>
          {selectedCourses.map((course) => (
            <View key={course.code} style={styles.selectedCourseItem}>
              <View style={styles.selectedCourseInfo}>
                <Text style={styles.selectedCourseCode}>{course.code}</Text>
                <Text style={styles.selectedCourseName}>{course.name}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleCourse(course)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      )}

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          title={`Register (${selectedCourses.length} courses, ${totalCredits} credits)`}
          onPress={handleSubmit}
          loading={submitting}
          disabled={selectedCourses.length === 0}
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#E8F5E9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.dark,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: 'bold',
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  courseItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: Colors.primary,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 2,
  },
  courseCodeSelected: {
    color: Colors.primary,
  },
  courseName: {
    fontSize: 13,
    color: Colors.gray,
  },
  courseNameSelected: {
    color: Colors.dark,
  },
  courseCredits: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray,
  },
  creditsTextSelected: {
    color: Colors.primary,
  },
  checkmark: {
    fontSize: 18,
    color: Colors.primary,
  },
  selectedCourseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.light,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedCourseInfo: {
    flex: 1,
  },
  selectedCourseCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  selectedCourseName: {
    fontSize: 12,
    color: Colors.gray,
  },
  removeButton: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  submitContainer: {
    padding: 16,
  },
});
