# students/utils/report_generator.py
import threading
import time
import json
import os
from datetime import datetime
from django.conf import settings
from django.core.files.base import ContentFile
from django.db.models import Avg, Count, Q
from ..models import Report, GPARecord, Achievement, Endorsement, Grade, StudentProfile, User


class AsyncReportGenerator:
    """Asynchronous report generation using threading"""
    
    @staticmethod
    def generate_comprehensive_report(report_id, report_type="performance", parameters=None):
        """
        Main method to generate reports asynchronously
        """
        def generate_report_task():
            try:
                report = Report.objects.get(id=report_id)
                report.status = 'processing'
                report.save()
                
                print(f"🔄 Starting {report_type} report generation for report {report_id}")
                
                # Simulate processing time for large reports
                time.sleep(2)
                
                if report_type == "performance":
                    report_data = AsyncReportGenerator._generate_performance_report(report.created_for)
                elif report_type == "endorsement":
                    report_data = AsyncReportGenerator._generate_endorsement_report(report.created_for)
                elif report_type == "comprehensive":
                    report_data = AsyncReportGenerator._generate_comprehensive_report(report.created_for)
                else:
                    raise ValueError(f"Unknown report type: {report_type}")
                
                # Save the report file
                file_content = AsyncReportGenerator._format_report_content(report_data, report_type)
                filename = f"report_{report_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
                report.file.save(filename, ContentFile(file_content.encode('utf-8')))
                
                # Update report status
                report.status = 'completed'
                report.completed_at = datetime.now()
                report.save()
                
                print(f"✅ Report {report_id} generated successfully!")
                
            except Exception as e:
                print(f"❌ Error generating report {report_id}: {e}")
                try:
                    report.status = 'failed'
                    report.error_message = str(e)
                    report.save()
                except:
                    pass
        
        # Start the report generation in a separate thread
        thread = threading.Thread(target=generate_report_task)
        thread.daemon = True
        thread.start()
        
        return thread
    
    @staticmethod
    def _generate_performance_report(user):
        """Generate student performance report"""
        try:
            # Get GPA records
            gpa_records = GPARecord.objects.filter(student=user).order_by('-semester__start_date')
            grades = Grade.objects.filter(student=user).select_related('course', 'semester')
            
            # Calculate statistics
            if gpa_records.exists():
                latest_gpa = gpa_records.first()
                average_gpa = gpa_records.aggregate(avg_gpa=Avg('gpa'))['avg_gpa'] or 0
                gpa_trend = AsyncReportGenerator._calculate_gpa_trend(gpa_records)
            else:
                latest_gpa = None
                average_gpa = 0
                gpa_trend = 'stable'
            
            # Course performance
            course_performance = []
            for grade in grades:
                course_performance.append({
                    'course': grade.course.name,
                    'grade': grade.grade_value,
                    'grade_letter': grade.grade_letter,
                    'semester': grade.semester.name,
                    'credits': grade.credits_earned
                })
            
            return {
                'report_type': 'performance',
                'student': {
                    'username': user.username,
                    'email': user.email,
                    'department': user.department,
                    'year': user.year
                },
                'gpa_analysis': {
                    'current_gpa': latest_gpa.gpa if latest_gpa else 0,
                    'current_cgpa': latest_gpa.cgpa if latest_gpa else 0,
                    'average_gpa': round(average_gpa, 2),
                    'gpa_trend': gpa_trend,
                    'total_credits': latest_gpa.total_credits if latest_gpa else 0,
                    'completed_credits': latest_gpa.completed_credits if latest_gpa else 0
                },
                'course_performance': course_performance,
                'semester_breakdown': [
                    {
                        'semester': record.semester.name,
                        'gpa': record.gpa,
                        'cgpa': record.cgpa,
                        'credits_completed': record.completed_credits
                    }
                    for record in gpa_records
                ],
                'recommendations': AsyncReportGenerator._generate_performance_recommendations(
                    gpa_records, grades
                ),
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {'error': f"Performance report generation failed: {str(e)}"}
    
    @staticmethod
    def _generate_endorsement_report(user):
        """Generate peer endorsement analytics report"""
        try:
            # Get achievements and endorsements
            achievements = Achievement.objects.filter(student=user).prefetch_related('endorsements')
            received_endorsements = Endorsement.objects.filter(target=user)
            
            # Calculate endorsement statistics
            total_endorsements = received_endorsements.count()
            average_rating = received_endorsements.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
            
            # Endorsement distribution
            rating_distribution = {}
            for i in range(1, 6):
                rating_distribution[str(i)] = received_endorsements.filter(rating=i).count()
            
            # Skill endorsements
            skill_endorsements = {}
            for endorsement in received_endorsements.select_related('skill'):
                if endorsement.skill:
                    skill_name = endorsement.skill.name
                    if skill_name not in skill_endorsements:
                        skill_endorsements[skill_name] = []
                    skill_endorsements[skill_name].append(endorsement.rating)
            
            # Calculate average per skill
            skill_analytics = {}
            for skill, ratings in skill_endorsements.items():
                skill_analytics[skill] = {
                    'count': len(ratings),
                    'average_rating': sum(ratings) / len(ratings),
                    'endorsers': len(set(ratings))
                }
            
            return {
                'report_type': 'endorsement',
                'student': {
                    'username': user.username,
                    'email': user.email
                },
                'summary': {
                    'total_endorsements': total_endorsements,
                    'average_rating': round(average_rating, 2),
                    'total_endorsers': received_endorsements.values('endorser').distinct().count(),
                    'achievements_with_endorsements': achievements.filter(endorsements__isnull=False).count()
                },
                'rating_distribution': rating_distribution,
                'skill_analytics': skill_analytics,
                'recent_endorsements': [
                    {
                        'endorser': end.endorser.username,
                        'rating': end.rating,
                        'comment': end.comment,
                        'skill': end.skill.name if end.skill else 'General',
                        'date': end.created_at.strftime('%Y-%m-%d')
                    }
                    for end in received_endorsements.order_by('-created_at')[:10]
                ],
                'insights': AsyncReportGenerator._generate_endorsement_insights(
                    received_endorsements, achievements
                ),
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {'error': f"Endorsement report generation failed: {str(e)}"}
    
    @staticmethod
    def _generate_comprehensive_report(user):
        """Generate comprehensive report combining all data"""
        try:
            performance_data = AsyncReportGenerator._generate_performance_report(user)
            endorsement_data = AsyncReportGenerator._generate_endorsement_report(user)
            
            # Remove error keys if present
            performance_data.pop('error', None)
            endorsement_data.pop('error', None)
            
            return {
                'report_type': 'comprehensive',
                'student': performance_data.get('student', {}),
                'performance_analysis': performance_data,
                'endorsement_analytics': endorsement_data,
                'overall_assessment': AsyncReportGenerator._generate_overall_assessment(
                    performance_data, endorsement_data
                ),
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {'error': f"Comprehensive report generation failed: {str(e)}"}
    
    @staticmethod
    def _format_report_content(report_data, report_type):
        """Format report data into readable text content"""
        if 'error' in report_data:
            return f"Report Generation Failed:\n{report_data['error']}"
        
        content = []
        
        if report_type == 'performance':
            content.extend(AsyncReportGenerator._format_performance_report(report_data))
        elif report_type == 'endorsement':
            content.extend(AsyncReportGenerator._format_endorsement_report(report_data))
        elif report_type == 'comprehensive':
            content.extend(AsyncReportGenerator._format_comprehensive_report(report_data))
        
        return '\n'.join(content)
    
    @staticmethod
    def _format_performance_report(data):
        """Format performance report as text"""
        content = [
            "STUDENT PERFORMANCE REPORT",
            "=" * 50,
            f"Student: {data['student']['username']}",
            f"Email: {data['student']['email']}",
            f"Department: {data['student']['department'] or 'Not specified'}",
            f"Year: {data['student']['year'] or 'Not specified'}",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "GPA ANALYSIS",
            "-" * 30,
            f"Current GPA: {data['gpa_analysis']['current_gpa']}",
            f"Current CGPA: {data['gpa_analysis']['current_cgpa']}",
            f"Average GPA: {data['gpa_analysis']['average_gpa']}",
            f"GPA Trend: {data['gpa_analysis']['gpa_trend']}",
            f"Total Credits: {data['gpa_analysis']['total_credits']}",
            f"Completed Credits: {data['gpa_analysis']['completed_credits']}",
            "",
            "SEMESTER BREAKDOWN",
            "-" * 30,
        ]
        
        for semester in data['semester_breakdown']:
            content.append(
                f"{semester['semester']}: GPA {semester['gpa']}, CGPA {semester['cgpa']}, "
                f"Credits: {semester['credits_completed']}"
            )
        
        content.extend([
            "",
            "RECOMMENDATIONS",
            "-" * 30,
        ])
        
        for i, recommendation in enumerate(data['recommendations'], 1):
            content.append(f"{i}. {recommendation}")
        
        return content
    
    @staticmethod
    def _format_endorsement_report(data):
        """Format endorsement report as text"""
        content = [
            "PEER ENDORSEMENT ANALYTICS REPORT",
            "=" * 50,
            f"Student: {data['student']['username']}",
            f"Email: {data['student']['email']}",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "SUMMARY",
            "-" * 30,
            f"Total Endorsements: {data['summary']['total_endorsements']}",
            f"Average Rating: {data['summary']['average_rating']}/5",
            f"Unique Endorsers: {data['summary']['total_endorsers']}",
            f"Achievements with Endorsements: {data['summary']['achievements_with_endorsements']}",
            "",
            "RATING DISTRIBUTION",
            "-" * 30,
        ]
        
        for rating, count in data['rating_distribution'].items():
            content.append(f"{rating} stars: {count} endorsements")
        
        if data['skill_analytics']:
            content.extend([
                "",
                "SKILL ENDORSEMENTS",
                "-" * 30,
            ])
            for skill, analytics in data['skill_analytics'].items():
                content.append(
                    f"{skill}: {analytics['count']} endorsements, "
                    f"Avg: {analytics['average_rating']:.1f}/5"
                )
        
        content.extend([
            "",
            "RECENT ENDORSEMENTS",
            "-" * 30,
        ])
        
        for endorsement in data['recent_endorsements'][:5]:
            content.append(
                f"{endorsement['endorser']} - {endorsement['rating']} stars "
                f"({endorsement['skill']}) - {endorsement['date']}"
            )
            if endorsement['comment']:
                content.append(f"  Comment: {endorsement['comment']}")
        
        return content
    
    @staticmethod
    def _format_comprehensive_report(data):
        """Format comprehensive report as text"""
        content = [
            "COMPREHENSIVE STUDENT REPORT",
            "=" * 50,
            f"Student: {data['student']['username']}",
            f"Email: {data['student']['email']}",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
        ]
        
        # Add performance summary
        perf = data['performance_analysis']
        content.extend([
            "ACADEMIC PERFORMANCE SUMMARY",
            "-" * 40,
            f"Current GPA: {perf['gpa_analysis']['current_gpa']}",
            f"Current CGPA: {perf['gpa_analysis']['current_cgpa']}",
            f"GPA Trend: {perf['gpa_analysis']['gpa_trend']}",
            "",
        ])
        
        # Add endorsement summary
        endor = data['endorsement_analytics']
        content.extend([
            "PEER ENDORSEMENT SUMMARY",
            "-" * 40,
            f"Total Endorsements: {endor['summary']['total_endorsements']}",
            f"Average Rating: {endor['summary']['average_rating']}/5",
            "",
        ])
        
        # Add overall assessment
        content.extend([
            "OVERALL ASSESSMENT",
            "-" * 40,
        ])
        
        for insight in data['overall_assessment']:
            content.append(f"• {insight}")
        
        return content
    
    # Helper methods for calculations and insights
    @staticmethod
    def _calculate_gpa_trend(gpa_records):
        """Calculate GPA trend (improving/declining/stable)"""
        if len(gpa_records) < 2:
            return 'insufficient_data'
        
        recent_gpas = [record.gpa for record in gpa_records[:3]]  # Last 3 semesters
        if len(recent_gpas) < 2:
            return 'stable'
        
        # Simple trend calculation
        first = recent_gpas[-1]
        last = recent_gpas[0]
        
        if last > first + 0.1:
            return 'improving'
        elif last < first - 0.1:
            return 'declining'
        else:
            return 'stable'
    
    @staticmethod
    def _generate_performance_recommendations(gpa_records, grades):
        """Generate personalized recommendations based on performance"""
        recommendations = []
        
        if not gpa_records.exists():
            recommendations.append("No GPA data available. Focus on consistent academic performance.")
            return recommendations
        
        current_gpa = gpa_records.first().gpa
        
        if current_gpa < 2.0:
            recommendations.extend([
                "Consider meeting with academic advisor to discuss improvement strategies",
                "Focus on foundational courses to build strong academic base",
                "Utilize campus tutoring and academic support services"
            ])
        elif current_gpa < 3.0:
            recommendations.extend([
                "Maintain consistent study schedule and seek help when needed",
                "Consider forming study groups for challenging courses",
                "Focus on time management and organization skills"
            ])
        else:
            recommendations.extend([
                "Continue maintaining excellent academic performance",
                "Consider taking on leadership roles or research opportunities",
                "Explore advanced courses in your field of interest"
            ])
        
        # Course-specific recommendations
        low_grades = [g for g in grades if g.grade_value < 70]
        if low_grades:
            course_names = ", ".join(set(g.course.name for g in low_grades))
            recommendations.append(f"Seek additional help in: {course_names}")
        
        return recommendations
    
    @staticmethod
    def _generate_endorsement_insights(endorsements, achievements):
        """Generate insights from endorsement data"""
        insights = []
        
        if not endorsements.exists():
            insights.append("No endorsements received yet. Consider sharing more achievements.")
            return insights
        
        avg_rating = endorsements.aggregate(avg=Avg('rating'))['avg'] or 0
        
        if avg_rating >= 4.5:
            insights.append("Excellent peer recognition! Your work is highly valued by peers.")
        elif avg_rating >= 4.0:
            insights.append("Strong peer endorsement. Maintain your collaborative approach.")
        else:
            insights.append("Good peer feedback. Consider seeking more specific endorsements.")
        
        # Skill diversity insight
        skills = set(e.skill.name for e in endorsements if e.skill)
        if len(skills) >= 3:
            insights.append(f"Diverse skill recognition across {len(skills)} different areas.")
        
        return insights
    
    @staticmethod
    def _generate_overall_assessment(performance_data, endorsement_data):
        """Generate overall assessment combining performance and endorsements"""
        assessment = []
        
        # Academic assessment
        gpa = performance_data['gpa_analysis']['current_gpa']
        if gpa >= 3.5:
            assessment.append("Strong academic performance with excellent GPA")
        elif gpa >= 3.0:
            assessment.append("Good academic standing with consistent performance")
        else:
            assessment.append("Academic performance needs improvement")
        
        # Endorsement assessment
        endorsement_count = endorsement_data['summary']['total_endorsements']
        avg_rating = endorsement_data['summary']['average_rating']
        
        if endorsement_count >= 10 and avg_rating >= 4.0:
            assessment.append("Excellent peer recognition and collaboration skills")
        elif endorsement_count >= 5:
            assessment.append("Active participant in peer learning community")
        else:
            assessment.append("Opportunity to increase peer engagement and visibility")
        
        # Combined insight
        if gpa >= 3.0 and endorsement_count >= 5:
            assessment.append("Well-rounded student with strong academic and social engagement")
        
        return assessment