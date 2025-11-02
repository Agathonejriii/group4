import React, { useState, useEffect } from "react";
import { ThumbsUp, Star, TrendingUp, Users, AlertCircle } from "lucide-react";
import { enhancedEndorsementScoring, generateEndorsementReport } from "../../utils/peerEndorsement";
import { studentAPI } from "../../api/config";

function AchievementsFeedPage({ currentUser = "Current User" }) {
  const [feed, setFeed] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [endorsementAnalytics, setEndorsementAnalytics] = useState({});
  const [reportGenerating, setReportGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Fetch students data
useEffect(() => {
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let studentsData = [];
      
      try {
        // Try the new peer students endpoint first
        studentsData = await studentAPI.getPeerStudents();
        console.log("✅ Peer students loaded:", studentsData);
      } catch (apiError) {
        console.log("❌ Peer students endpoint failed, trying main students endpoint:", apiError.message);
        
        // Fallback to main students endpoint
        try {
          studentsData = await studentAPI.getStudents();
          console.log("✅ Students data loaded:", studentsData);
        } catch (secondError) {
          console.log("❌ Both endpoints failed, using demo data:", secondError.message);
          setError("Using limited data access. Some features may be restricted.");
          setUsingFallback(true);
          
          // Final fallback - use demo data
          studentsData = getFallbackStudents();
        }
      }
      
      setRegisteredStudents(studentsData);
      
    } catch (err) {
      console.error("❌ Final error fetching students:", err);
      setError("Failed to load student data. Using demo data.");
      setRegisteredStudents(getFallbackStudents());
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  fetchStudents();
}, []);

  // Fallback demo students
  const getFallbackStudents = () => {
    return [
      { id: 1, username: "john_doe", email: "john@student.com", role: "student" },
      { id: 2, username: "jane_smith", email: "jane@student.com", role: "student" },
      { id: 3, username: "mike_johnson", email: "mike@student.com", role: "student" },
      { id: 4, username: "sarah_wilson", email: "sarah@student.com", role: "student" },
      { id: 5, username: "alex_brown", email: "alex@student.com", role: "student" },
    ];
  };

  // Load achievements
  useEffect(() => {
    const loadAchievements = () => {
      try {
        const sampleAchievements = getSampleAchievements(registeredStudents);
        setFeed(sampleAchievements);
        console.log("✅ Loaded achievements:", sampleAchievements.length);
      } catch (err) {
        console.error("❌ Error loading achievements:", err);
        setError("Failed to load achievements");
      }
    };

    if (registeredStudents.length > 0) {
      loadAchievements();
    }
  }, [registeredStudents]);

  // Generate sample achievements with real student data
  const getSampleAchievements = (students) => {
    if (students.length === 0) return [];

    const achievementTemplates = [
      {
        title: "AI Research Project",
        description: "Completed a comprehensive research project on natural language processing and machine learning.",
        category: "research",
        progress: 100
      },
      {
        title: "Web Development Portfolio",
        description: "Built a full-stack web application using React, Node.js, and MongoDB.",
        category: "development", 
        progress: 90
      },
      {
        title: "Hackathon Winner 2025",
        description: "Led a team that won first place in the 2025 National Tech Innovation Hackathon.",
        category: "competition",
        progress: 100
      },
      {
        title: "Mobile App Development",
        description: "Created a cross-platform mobile application using React Native.",
        category: "development",
        progress: 85
      },
      {
        title: "Research Paper Publication",
        description: "Published a paper in an international computer science journal.",
        category: "research",
        progress: 100
      }
    ];

    return students.slice(0, 5).map((student, index) => {
      const template = achievementTemplates[index % achievementTemplates.length];
      const endorsers = students.filter(s => s.id !== student.id).slice(0, 3);
      
      return {
        id: student.id,
        user: student.username,
        userId: student.id,
        title: template.title,
        description: template.description,
        progress: template.progress,
        endorsements: endorsers.length,
        endorsedByUser: false,
        category: template.category,
        detailedEndorsements: endorsers.map((endorser, i) => ({
          peerId: endorser.id,
          peerName: endorser.username,
          score: 4 + (i % 2), // Alternating scores 4-5
          timestamp: new Date(Date.now() - i * 86400000).toISOString().split('T')[0] // Recent dates
        })),
        peerHistory: endorsers.reduce((acc, endorser, i) => {
          acc[endorser.id] = 0.7 + (i * 0.1); // 0.7, 0.8, 0.9
          return acc;
        }, {})
      };
    });
  };

  // Calculate endorsement analytics
  useEffect(() => {
    const analytics = {};
    feed.forEach(achievement => {
      analytics[achievement.id] = enhancedEndorsementScoring(
        achievement.detailedEndorsements,
        achievement.peerHistory
      );
    });
    setEndorsementAnalytics(analytics);
  }, [feed]);

  const handleEndorse = (achievementId) => {
    setFeed(prevFeed =>
      prevFeed.map(item => {
        if (item.id === achievementId) {
          const isCurrentlyEndorsed = item.endorsedByUser;
          const newEndorsementCount = isCurrentlyEndorsed ? item.endorsements - 1 : item.endorsements + 1;
          
          let updatedEndorsements = [...item.detailedEndorsements];
          if (isCurrentlyEndorsed) {
            updatedEndorsements = updatedEndorsements.filter(e => e.peerId !== "currentUser");
          } else {
            updatedEndorsements.push({
              peerId: "currentUser",
              peerName: currentUser,
              score: 5,
              timestamp: new Date().toISOString().split('T')[0]
            });
          }

          return {
            ...item,
            endorsements: newEndorsementCount,
            endorsedByUser: !isCurrentlyEndorsed,
            detailedEndorsements: updatedEndorsements
          };
        }
        return item;
      })
    );
  };

  const generateReport = () => {
    setReportGenerating(true);
    try {
      const report = generateEndorsementReport(feed);
      console.log("Endorsement Analytics Report:", report);
      
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `endorsement-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      setTimeout(() => {
        alert("Endorsement report generated and downloaded!");
        setReportGenerating(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error generating report. Check console for details.");
      setReportGenerating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return "text-success";
    if (score >= 4.0) return "text-primary";
    if (score >= 3.0) return "text-warning";
    return "text-secondary";
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return "success";
    if (confidence >= 0.4) return "warning";
    return "secondary";
  };

  if (loading) {
    return (
      <div className="card shadow p-4 mb-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading achievements...</span>
          </div>
          <p className="mt-2 text-muted">Loading peer achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow p-4 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-1">🌟 Peer Achievements Feed</h4>
          <p className="text-muted mb-0">
            Explore what your peers are achieving and endorse their progress!
            {registeredStudents.length > 0 && (
              <span className="badge bg-info ms-2">
                {registeredStudents.length} students in system
              </span>
            )}
            {usingFallback && (
              <span className="badge bg-warning text-dark ms-2">
                Limited Data Access
              </span>
            )}
          </p>
        </div>
        <button 
          className="btn btn-outline-primary btn-sm"
          onClick={generateReport}
          disabled={reportGenerating || feed.length === 0}
        >
          {reportGenerating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Generating...
            </>
          ) : (
            <>
              <TrendingUp size={16} className="me-2" />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <AlertCircle size={16} className="me-2" />
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {feed.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No achievements found yet.</p>
          <p className="text-muted small">
            Students haven't shared any achievements yet.
          </p>
        </div>
      ) : (
        <div>
          {feed.map((ach) => {
            const analytics = endorsementAnalytics[ach.id] || {};
            
            return (
              <div
                key={ach.id}
                className="card mb-3 p-3"
                style={{ backgroundColor: "#f1faee" }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1 me-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="fw-bold mb-1">{ach.title}</h5>
                      {analytics.overallScore && (
                        <div className="d-flex align-items-center">
                          <Star size={16} className={`me-1 ${getScoreColor(analytics.overallScore)}`} />
                          <span className={`fw-bold ${getScoreColor(analytics.overallScore)}`}>
                            {analytics.overallScore?.toFixed?.(1) || 'N/A'}
                          </span>
                          {analytics.confidence && (
                            <span className={`badge bg-${getConfidenceColor(analytics.confidence)} ms-2`}>
                              {Math.round(analytics.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-muted mb-1">
                      <em>by {ach.user}</em>
                    </p>
                    <p className="mb-2">{ach.description}</p>

                    <div className="progress mb-2" style={{ height: "8px" }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${ach.progress}%` }}
                      ></div>
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                      <span className="badge bg-info">
                        Progress: {ach.progress}%
                      </span>
                      <span className="badge bg-secondary">
                        <Users size={12} className="me-1" />
                        {ach.endorsements} endorsements
                      </span>
                      <span className="badge bg-primary text-capitalize">
                        {ach.category}
                      </span>
                      {analytics.breakdown && (
                        <span className="badge bg-light text-dark">
                          Credibility: {analytics.breakdown.avgPeerCredibility?.toFixed?.(1) || 'N/A'}
                        </span>
                      )}
                    </div>

                    {analytics.breakdown && (
                      <div className="mt-2 small text-muted">
                        <div className="d-flex gap-3 flex-wrap">
                          <span>Base: {analytics.breakdown.baseScore?.toFixed?.(1) || 'N/A'}</span>
                          <span>Consistency: +{analytics.breakdown.consistencyBonus?.toFixed?.(1) || 'N/A'}</span>
                          <span>Participation: +{analytics.breakdown.participationBonus?.toFixed?.(1) || 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className={`btn ${
                      ach.endorsedByUser ? "btn-secondary" : "btn-outline-primary"
                    } d-flex align-items-center`}
                    onClick={() => handleEndorse(ach.id)}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    <ThumbsUp size={16} className="me-2" />
                    {ach.endorsedByUser ? "Endorsed" : "Endorse"} ({ach.endorsements})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AchievementsFeedPage;