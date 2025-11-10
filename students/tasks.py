# students/tasks.py
from .utils.report_generator import AsyncReportGenerator

def async_generate_report(report_id):
    """
    Main async report generation task
    """
    print(f"🎯 Starting async report generation for report {report_id}")
    
    # Get the report to determine type
    from .models import Report
    try:
        report = Report.objects.get(id=report_id)
        report_type = report.report_type or 'performance'
        
        # Start async generation
        thread = AsyncReportGenerator.generate_comprehensive_report(
            report_id, 
            report_type,
            report.parameters
        )
        
        return thread
        
    except Report.DoesNotExist:
        print(f"❌ Report {report_id} not found!")
        return None
    except Exception as e:
        print(f"❌ Error starting report generation: {e}")
        return None