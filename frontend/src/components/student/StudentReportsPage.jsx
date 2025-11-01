import React, { useState, useEffect } from "react";
import { studentAPI } from "../../services/api";
import { Download, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, RefreshCw, Info } from "lucide-react";


function StudentReportsPage() {
  const [reports, setReports] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Load user data
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || 'null');
    setUserData(user);
  }, []);

  // Fetch user's existing reports
  const fetchUserReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const reportsData = await studentAPI.getReports();
      setReports(reportsData);
      
      // Check if we're using fallback data
      if (reportsData.length > 0 && reportsData[0].id === 1) {
        setUsingFallback(true);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports: ' + error.message);
      setUsingFallback(true);
      
      // Use sample data for development
      setReports([
        {
          id: 1,
          title: "Academic Performance Report - Fall 2024",
          report_type: "performance",
          status: "completed",
          created_at: "2024-01-15T10:30:00Z",
          file_url: "#"
        },
        {
          id: 2,
          title: "Peer Endorsement Analysis",
          report_type: "endorsement",
          status: "completed", 
          created_at: "2024-01-10T14:20:00Z",
          file_url: "#"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReports();
  }, []);

  const generateReport = async (reportType = 'comprehensive') => {
    try {
      setGeneratingReport(true);
      setError(null);
      console.log('🔄 Starting threaded report generation...');
      
      const studentId = userData?.id || 'current';
      const result = await studentAPI.generateReport(studentId, reportType);
      console.log('✅ Thread started:', result);
      
      if (result.task_id) {
        setReportStatus({
          status: 'processing',
          title: `Generating ${reportType} Report`,
          message: 'Report generation started in background...',
          progress: '0%',
          taskId: result.task_id
        });

        // Start polling for the threaded task
        studentAPI.pollReportStatus(
          result.task_id,
          // Progress callback
          (status) => {
            setReportStatus(prev => ({
              ...prev,
              progress: `${status.progress || 0}%`,
              message: `Processing... ${status.progress || 0}% complete`
            }));
          },
          // Completion callback
          (status) => {
            setReportStatus({
              status: 'completed',
              title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
              message: 'Report generated successfully!',
              progress: '100%'
            });
            
            // Add to reports list
            const newReport = {
              id: status.task_id,
              title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
              report_type: reportType,
              status: 'completed',
              created_at: new Date().toISOString(),
              file_url: status.result?.report_url || `#${status.task_id}`
            };
            
            setReports(prev => [newReport, ...prev]);
            setUsingFallback(true);
          },
          // Error callback
          (error) => {
            setError(`Report generation failed: ${error}`);
            setReportStatus({
              status: 'failed',
              title: 'Report Generation Failed',
              message: error,
              progress: '0%'
            });
          },
          3000 // Poll every 3 seconds
        );
      }
      
    } catch (error) {
      console.error('❌ Error starting report generation:', error);
      setError('Failed to start report generation: ' + error.message);
      
      // For development, simulate success even if API fails
      console.log('⚠️ Using development mode - simulating report generation');
      simulateReportProgress(Date.now(), reportType);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Simulation for development (fallback)
  const simulateReportProgress = (reportId, reportType) => {
    setReportStatus({
      status: 'processing',
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      message: 'Generating your report...',
      progress: '0%'
    });

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setReportStatus(prev => ({
        ...prev,
        progress: `${progress}%`,
        message: `Processing... ${progress}% complete`
      }));

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setReportStatus({
            status: 'completed',
            title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
            message: 'Report generated successfully!',
            progress: '100%'
          });
          
          // Add to reports list
          const newReport = {
            id: reportId,
            title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
            report_type: reportType,
            status: 'completed',
            created_at: new Date().toISOString(),
            file_url: `#${reportId}`
          };
          
          setReports(prev => [newReport, ...prev]);
          setUsingFallback(true);
        }, 500);
      }
    }, 300);
  };

  const downloadReport = async (reportId) => {
    try {
      await studentAPI.downloadReport(reportId);
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report: ' + error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-success" />;
      case 'processing':
        return <Clock size={16} className="text-warning" />;
      case 'pending':
        return <Clock size={16} className="text-secondary" />;
      case 'failed':
        return <AlertCircle size={16} className="text-danger" />;
      default:
        return <FileText size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container-fluid">
      <div className="card shadow mb-4">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">📊 Student Reports Center</h4>
          {usingFallback && (
            <span className="badge bg-warning text-dark">
              Development Mode
            </span>
          )}
        </div>
        <div className="card-body">
          {/* Development Mode Notice */}
          {usingFallback && (
            <div className="alert alert-info d-flex align-items-center">
              <Info size={16} className="me-2" />
              <div>
                <strong>Development Mode:</strong> Using simulated data. 
                Backend reports API will be available soon.
                <button 
                  className="btn btn-sm btn-outline-info ms-2"
                  onClick={() => {
                    setUsingFallback(false);
                    fetchUserReports();
                  }}
                >
                  <RefreshCw size={14} className="me-1" />
                  Retry API
                </button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <AlertCircle size={16} className="me-2" />
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError(null)}
              ></button>
            </div>
          )}

          {/* Report Generation Section */}
          <div className="row mb-4">
            <div className="col-12">
              <h5>Generate New Report</h5>
              <p className="text-muted">
                Create comprehensive reports about your academic performance and peer endorsements.
                {usingFallback && " (Simulation Mode)"}
              </p>
              
              <div className="d-flex gap-3 flex-wrap">
                <button
                  className={`btn btn-primary d-flex align-items-center ${generatingReport ? 'disabled' : ''}`}
                  onClick={() => generateReport('performance')}
                  disabled={generatingReport}
                >
                  <TrendingUp size={18} className="me-2" />
                  {generatingReport ? 'Generating...' : 'Academic Performance Report'}
                </button>

                <button
                  className={`btn btn-info d-flex align-items-center ${generatingReport ? 'disabled' : ''}`}
                  onClick={() => generateReport('endorsement')}
                  disabled={generatingReport}
                >
                  <FileText size={18} className="me-2" />
                  {generatingReport ? 'Generating...' : 'Peer Endorsement Report'}
                </button>

                <button
                  className={`btn btn-success d-flex align-items-center ${generatingReport ? 'disabled' : ''}`}
                  onClick={() => generateReport('comprehensive')}
                  disabled={generatingReport}
                >
                  <Download size={18} className="me-2" />
                  {generatingReport ? 'Generating...' : 'Comprehensive Report'}
                </button>
              </div>

              {/* Current Report Status */}
              {reportStatus && (
                <div className="mt-3 p-3 bg-light rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Current Report Status</h6>
                    <span className={`badge bg-${getStatusColor(reportStatus.status)}`}>
                      {reportStatus.status}
                    </span>
                  </div>
                  <div className="d-flex align-items-center">
                    {getStatusIcon(reportStatus.status)}
                    <div className="ms-2 flex-grow-1">
                      <strong>{reportStatus.title}</strong>
                      <div className="small text-muted">{reportStatus.message}</div>
                      {reportStatus.progress && (
                        <div className="mt-2">
                          <div className="progress" style={{ height: '6px' }}>
                            <div 
                              className={`progress-bar bg-${getStatusColor(reportStatus.status)}`}
                              style={{ width: reportStatus.progress }}
                            ></div>
                          </div>
                          <small className="text-muted">{reportStatus.progress}</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Existing Reports Section */}
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Your Generated Reports</h5>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={fetchUserReports}
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? "spinner-border spinner-border-sm" : ""} />
                  <span className="ms-1">Refresh</span>
                </button>
              </div>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading reports...</span>
                  </div>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <FileText size={48} className="mb-2" />
                  <p>No reports generated yet. Create your first report above!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Report</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
  {reports.map((report) => (
    <tr key={report.id}>
      <td>
        <strong>{report.title}</strong>
      </td>
      <td>
        <span className="badge bg-primary text-capitalize">
          {report.report_type}
        </span>
      </td>
      <td>
        <span className={`badge bg-${getStatusColor(report.status)} d-flex align-items-center`} style={{width: 'fit-content'}}>
          {getStatusIcon(report.status)}
          <span className="ms-1 text-capitalize">{report.status}</span>
        </span>
      </td>
      <td>
        {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
      </td>
      <td>
        {report.status === 'completed' ? (
          <button
            className="btn btn-sm btn-success d-flex align-items-center"
            onClick={() => downloadReport(report.id)}
          >
            <Download size={14} className="me-1" />
            Download
          </button>
        ) : (
          <span className="text-muted small">
            {report.status === 'processing' ? 'Generating...' : 'Not available'}
          </span>
        )}
      </td>
    </tr>
  ))}
</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentReportsPage;