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
import Card from '../components/Card';
import Button from '../components/Button';
import Colors from '../constants/colors';

export default function CourseRegistrationScreen({ navigation }) {
  const [semester, setSemester] = useState('1');
  const [year, setYear] = useState('2024/2025');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [customCourse, setCustomCourse] = useState({ code: '', name: '', credits: '' });

  // Sample courses (you can fetch from backend later)
  const availableCourses = [
    { id: 1, code: 'CSC101', name: 'Introduction to Programming', credits: 3 },
    { id: 2, code: 'CSC102', name: 'Data Structures', credits: 3 },
    { id: 3, code: 'MTH101', name: 'Calculus I', credits: 4 },
    { id: 4, code: 'PHY101', name: 'Physics I', credits: 3 },
    { id: 5, code: 'ENG101', name: 'English Composition', credits: 2 },
    { id: 6, code: 'CSC201', name: 'Database Systems', credits: 3 },
    { id: 7, code: 'CSC202', name: 'Computer Networks', credits: 3 },
    { id: 8, code: 'MTH201', name: 'Linear Algebra', credits: 3 },
  ];

  const toggleCourse = (course) => {
    const isSelected = selectedCourses.find(c => c.id === course.id);
    if (isSelected) {
      setSelectedCourses(selectedCourses.filter(c => c.id !== course.id));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const addCustomCourse = () => {
    if (!customCourse.code || !customCourse.name || !customCourse.credits) {
      Alert.alert('Error', 'Please fill in all course details');
      return;
    }

    const newCourse = {
      id: `custom-${Date.now()}`,
      code: customCourse.code,
      name: customCourse.name,
      credits: parseInt(customCourse.credits),
      isCustom: true,
    };

    setSelectedCourses([...selectedCourses, newCourse]);
    setCustomCourse({ code: '', name: '', credits: '' });
    Alert.alert('Success', 'Custom course added!');
  };

  const totalCredits = selectedCourses.reduce((sum, course) => sum + course.credits, 0);

  const handleSubmit = () => {
    if (selectedCourses.length === 0) {
      Alert.alert('Error', 'Please select at least one course');
      return;
    }

    Alert.alert(
      'Confirm Registration',
      `Register for ${selectedCourses.length} courses (${totalCredits} credits) for Semester ${semester}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Here you would send to backend
            Alert.alert('Success', 'Course registration submitted!', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Registration</Text>
        <Text style={styles.headerSubtitle}>Select courses for the semester</Text>
      </View>

      {/* Semester Selection */}
      <Card>
        <Text style={styles.sectionTitle}>📅 Semester Information</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Academic Year</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              placeholder="2024/2025"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Semester</Text>
            <View style={styles.semesterButtons}>
              {['1', '2'].map((sem) => (
                <TouchableOpacity
                  key={sem}
                  style={[
                    styles.semesterButton,
                    semester === sem && styles.semesterButtonActive,
                  ]}
                  onPress={() => setSemester(sem)}
                >
                  <Text
                    style={[
                      styles.semesterButtonText,
                      semester === sem && styles.semesterButtonTextActive,
                    ]}
                  >
                    {sem}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Card>

      {/* Available Courses */}
      <Card>
        <Text style={styles.sectionTitle}>📚 Available Courses</Text>
        {availableCourses.map((course) => {
          const isSelected = selectedCourses.find(c => c.id === course.id);
          return (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseItem, isSelected && styles.courseItemSelected]}
              onPress={() => toggleCourse(course)}
            >
              <View style={styles.courseInfo}>
                <Text style={styles.courseCode}>{course.code}</Text>
                <Text style={styles.courseName}>{course.name}</Text>
              </View>
              <View style={styles.courseRight}>
                <Text style={styles.credits}>{course.credits} credits</Text>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* Add Custom Course */}
      <Card>
        <Text style={styles.sectionTitle}>➕ Add Custom Course</Text>
        <TextInput
          style={styles.input}
          placeholder="Course Code (e.g., CSC301)"
          value={customCourse.code}
          onChangeText={(text) => setCustomCourse({ ...customCourse, code: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Course Name"
          value={customCourse.name}
          onChangeText={(text) => setCustomCourse({ ...customCourse, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Credits"
          value={customCourse.credits}
          onChangeText={(text) => setCustomCourse({ ...customCourse, credits: text })}
          keyboardType="numeric"
        />
        <Button title="Add Course" onPress={addCustomCourse} variant="outline" />
      </Card>

      {/* Selected Courses Summary */}
      {selectedCourses.length > 0 && (
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>✅ Selected Courses ({selectedCourses.length})</Text>
          {selectedCourses.map((course) => (
            <View key={course.id} style={styles.selectedCourse}>
              <View>
                <Text style={styles.selectedCourseCode}>{course.code}</Text>
                <Text style={styles.selectedCourseName}>{course.name}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleCourse(course)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Credits:</Text>
            <Text style={styles.totalValue}>{totalCredits}</Text>
          </View>
        </Card>
      )}

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          title={`Register for ${selectedCourses.length} Courses`}
          onPress={handleSubmit}
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
    color: Colors.white,
    fontSize: 16,
    marginBottom: 10,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 16,
    marginBottom: 12,
  },
  semesterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  semesterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.gray,
    alignItems: 'center',
  },
  semesterButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  semesterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray,
  },
  semesterButtonTextActive: {
    color: Colors.white,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light,
    borderRadius: 8,
    marginBottom: 10,
  },
  courseItemSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    color: Colors.gray,
  },
  courseRight: {
    alignItems: 'flex-end',
  },
  credits: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#F0F9FF',
  },
  selectedCourse: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  selectedCourseCode: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  selectedCourseName: {
    fontSize: 13,
    color: Colors.gray,
  },
  removeButton: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  submitContainer: {
    padding: 16,
  },
});
