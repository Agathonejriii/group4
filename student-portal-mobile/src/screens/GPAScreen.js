import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { fetchGPARecords } from '../api/config';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Colors from '../constants/colors';

const { width } = Dimensions.get('window');

export default function GPAScreen() {
  const [gpaRecords, setGpaRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cgpa, setCgpa] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    loadGPARecords();
  }, []);

  const loadGPARecords = async () => {
    try {
      const data = await fetchGPARecords();
      const records = Array.isArray(data) ? data : [];
      setGpaRecords(records);
      
      // Calculate overall CGPA and total credits
      if (records.length > 0) {
        // If CGPA exists in the latest record, use it
        const latestRecord = records[0];
        if (latestRecord.cgpa) {
          setCgpa(parseFloat(latestRecord.cgpa));
        } else {
          // Calculate CGPA from all records
          const totalGPA = records.reduce((sum, record) => sum + parseFloat(record.gpa || 0), 0);
          const calculatedCGPA = totalGPA / records.length;
          setCgpa(calculatedCGPA);
        }
        
        // Calculate total credits
        const credits = records.reduce((sum, record) => sum + parseInt(record.total_credits || 0), 0);
        setTotalCredits(credits);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGPARecords();
  };

  const getGradeColor = (gpa) => {
    const gpaValue = parseFloat(gpa);
    if (gpaValue >= 3.5) return '#4CAF50'; // Green
    if (gpaValue >= 3.0) return '#8BC34A'; // Light Green
    if (gpaValue >= 2.5) return '#FF9800'; // Orange
    if (gpaValue >= 2.0) return '#FF5722'; // Deep Orange
    return '#F44336'; // Red
  };

  const getPerformanceLabel = (gpa) => {
    const gpaValue = parseFloat(gpa);
    if (gpaValue >= 3.7) return 'Excellent';
    if (gpaValue >= 3.3) return 'Very Good';
    if (gpaValue >= 3.0) return 'Good';
    if (gpaValue >= 2.5) return 'Satisfactory';
    if (gpaValue >= 2.0) return 'Fair';
    return 'Needs Improvement';
  };

  const renderHeader = () => (
    <View>
      {/* CGPA Overview Card */}
      <Card style={styles.cgpaCard}>
        <Text style={styles.cgpaLabel}>Current CGPA</Text>
        <View style={styles.cgpaContainer}>
          <View style={[styles.cgpaCircle, { borderColor: getGradeColor(cgpa) }]}>
            <Text style={[styles.cgpaValue, { color: getGradeColor(cgpa) }]}>
              {cgpa.toFixed(2)}
            </Text>
            <Text style={styles.cgpaMaxText}>/ 4.00</Text>
          </View>
          <View style={styles.cgpaDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Performance:</Text>
              <Text style={[styles.detailValue, { color: getGradeColor(cgpa) }]}>
                {getPerformanceLabel(cgpa)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Semesters:</Text>
              <Text style={styles.detailValue}>{gpaRecords.length}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Credits:</Text>
              <Text style={styles.detailValue}>{totalCredits}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Semester Statistics */}
      <Card>
        <Text style={styles.sectionTitle}>📊 Semester Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {gpaRecords.length > 0 ? gpaRecords[0].gpa : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Latest GPA</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {gpaRecords.length > 0 
                ? Math.max(...gpaRecords.map(r => parseFloat(r.gpa || 0))).toFixed(2)
                : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Highest GPA</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {gpaRecords.length > 0 
                ? (gpaRecords.reduce((sum, r) => sum + parseFloat(r.gpa || 0), 0) / gpaRecords.length).toFixed(2)
                : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Average GPA</Text>
          </View>
        </View>
      </Card>

      {/* GPA Trend Indicator */}
      {gpaRecords.length >= 2 && (
        <Card style={styles.trendCard}>
          <Text style={styles.sectionTitle}>📈 Trend Analysis</Text>
          {(() => {
            const latest = parseFloat(gpaRecords[0].gpa || 0);
            const previous = parseFloat(gpaRecords[1].gpa || 0);
            const difference = latest - previous;
            const isImproving = difference > 0;
            const isStable = Math.abs(difference) < 0.1;
            
            return (
              <View style={styles.trendContainer}>
                <Text style={styles.trendIcon}>
                  {isStable ? '➡️' : isImproving ? '📈' : '📉'}
                </Text>
                <View style={styles.trendInfo}>
                  <Text style={styles.trendText}>
                    {isStable 
                      ? 'Your GPA is stable' 
                      : isImproving 
                        ? 'Great job! Your GPA is improving' 
                        : 'Your GPA decreased from last semester'}
                  </Text>
                  <Text style={[
                    styles.trendDifference,
                    { color: isImproving ? Colors.success : Colors.danger }
                  ]}>
                    {difference > 0 ? '+' : ''}{difference.toFixed(2)} from last semester
                  </Text>
                </View>
              </View>
            );
          })()}
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>📚 Semester History</Text>
      </Card>
    </View>
  );

  const renderGPAItem = ({ item, index }) => (
    <Card>
      <View style={styles.gpaHeader}>
        <View style={styles.semesterInfo}>
          <View style={styles.semesterBadge}>
            <Text style={styles.semesterBadgeText}>Sem {item.semester || index + 1}</Text>
          </View>
          <View>
            <Text style={styles.semester}>Semester {item.semester || index + 1}</Text>
            <Text style={styles.date}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              }) : 'No date'}
            </Text>
          </View>
        </View>
        <View style={[styles.gpaCircle, { borderColor: getGradeColor(item.gpa) }]}>
          <Text style={[styles.gpaValue, { color: getGradeColor(item.gpa) }]}>
            {item.gpa || 'N/A'}
          </Text>
          <Text style={styles.gpaLabel}>GPA</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.detailsGrid}>
        {item.cgpa && (
          <View style={styles.detailItem}>
            <Text style={styles.detailItemLabel}>CGPA</Text>
            <Text style={styles.detailItemValue}>{item.cgpa}</Text>
          </View>
        )}
        {item.total_credits && (
          <View style={styles.detailItem}>
            <Text style={styles.detailItemLabel}>Credits</Text>
            <Text style={styles.detailItemValue}>{item.total_credits}</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Text style={styles.detailItemLabel}>Grade</Text>
          <Text style={[styles.detailItemValue, { color: getGradeColor(item.gpa) }]}>
            {getPerformanceLabel(item.gpa)}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Academic Performance</Text>
        <Text style={styles.headerSubtitle}>
          Track your GPA and CGPA
        </Text>
      </View>

      {gpaRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>No GPA records found</Text>
          <Text style={styles.emptySubtext}>
            Your GPA records will appear here once they are added
          </Text>
        </View>
      ) : (
        <FlatList
          data={gpaRecords}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderGPAItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
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
  list: {
    padding: 16,
  },
  cgpaCard: {
    backgroundColor: '#F3F4F6',
  },
  cgpaLabel: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 12,
    fontWeight: '500',
  },
  cgpaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  cgpaCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  cgpaValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  cgpaMaxText: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
  },
  cgpaDetails: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
  },
  trendCard: {
    backgroundColor: '#FFF9C4',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendIcon: {
    fontSize: 32,
  },
  trendInfo: {
    flex: 1,
  },
  trendText: {
    fontSize: 14,
    color: Colors.dark,
    marginBottom: 4,
  },
  trendDifference: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gpaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  semesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  semesterBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  semesterBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  semester: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: Colors.gray,
  },
  gpaCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  gpaValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  gpaLabel: {
    fontSize: 10,
    color: Colors.gray,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light,
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailItemLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 4,
  },
  detailItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
});
