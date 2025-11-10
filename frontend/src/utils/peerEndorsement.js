// frontend/src/utils/peerEndorsement.js

// Simple math utility functions
const calculateMean = (arr) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

const calculateStandardDeviation = (arr) => {
  if (!arr || arr.length < 2) return 0;
  const avg = calculateMean(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(calculateMean(squareDiffs));
};

// Functional programming operations for endorsement scoring
export const calculateEndorsementScore = (endorsements) => {
  if (!endorsements || endorsements.length === 0) return 0.0;
  
  const validEndorsements = endorsements.filter(e => 
    e.score >= 1 && e.score <= 5
  );
  
  if (validEndorsements.length === 0) return 0.0;
  
  const total = validEndorsements.reduce((acc, e) => acc + e.score, 0);
  return Number((total / validEndorsements.length).toFixed(2));
};

export const calculateConsistencyBonus = (endorsements) => {
  if (endorsements.length < 2) return 0.0;
  
  const scores = endorsements.map(e => e.score);
  const standardDeviation = calculateStandardDeviation(scores);
  return Math.max(0, (2 - standardDeviation) * 0.15);
};

export const enhancedEndorsementScoring = (endorsements, peerHistory = {}) => {
  if (!endorsements || endorsements.length === 0) {
    return {
      overallScore: 0.0,
      breakdown: {},
      analytics: {},
      confidence: 0.0
    };
  }
  
  // Enhance endorsements with credibility weights
  const enhancedEndorsements = endorsements.map(endorsement => ({
    ...endorsement,
    peerCredibility: peerHistory[endorsement.peerId] || 0.7
  }));
  
  // Calculate base score
  const baseScore = calculateEndorsementScore(enhancedEndorsements);
  
  // Calculate bonuses
  const consistencyBonus = calculateConsistencyBonus(enhancedEndorsements);
  const participationBonus = Math.min(0.3, enhancedEndorsements.length * 0.05);
  
  // Final score with bonuses
  const finalScore = Math.min(5.0, baseScore + consistencyBonus + participationBonus);
  
  // Calculate confidence level
  const credibilityScores = enhancedEndorsements.map(e => e.peerCredibility);
  const avgCredibility = credibilityScores.length > 0 ? calculateMean(credibilityScores) : 0;
  const confidence = Math.min(1.0, enhancedEndorsements.length * 0.1 + avgCredibility * 0.5);
  
  return {
    overallScore: Number(finalScore.toFixed(2)),
    breakdown: {
      baseScore: Number(baseScore.toFixed(2)),
      consistencyBonus: Number(consistencyBonus.toFixed(2)),
      participationBonus: Number(participationBonus.toFixed(2)),
      avgPeerCredibility: Number(avgCredibility.toFixed(2))
    },
    analytics: {
      totalEndorsements: enhancedEndorsements.length,
      uniquePeers: new Set(enhancedEndorsements.map(e => e.peerId)).size,
      scoreDistribution: {
        min: Math.min(...enhancedEndorsements.map(e => e.score)),
        max: Math.max(...enhancedEndorsements.map(e => e.score)),
        average: Number(calculateMean(enhancedEndorsements.map(e => e.score)).toFixed(2))
      }
    },
    confidence: Number(confidence.toFixed(2))
  };
};

// Generate comprehensive endorsement report
export const generateEndorsementReport = (achievements) => {
  const scoredAchievements = achievements.map(achievement => ({
    ...achievement,
    endorsementAnalysis: enhancedEndorsementScoring(
      achievement.detailedEndorsements || [],
      achievement.peerHistory || {}
    )
  }));
  
  const rankedAchievements = [...scoredAchievements].sort(
    (a, b) => b.endorsementAnalysis.overallScore - a.endorsementAnalysis.overallScore
  );
  
  const overallScores = scoredAchievements.map(a => a.endorsementAnalysis.overallScore);
  const avgScore = overallScores.length > 0 ? calculateMean(overallScores) : 0;
  
  return {
    reportId: `endorsement_report_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    summary: {
      totalAchievements: rankedAchievements.length,
      averageScore: Number(avgScore.toFixed(2)),
      topRatedAchievement: rankedAchievements[0] || null,
      scoreRange: {
        min: overallScores.length > 0 ? Math.min(...overallScores) : 0,
        max: overallScores.length > 0 ? Math.max(...overallScores) : 0
      }
    },
    rankedAchievements: rankedAchievements,
    analytics: {
      highConfidence: scoredAchievements.filter(a => a.endorsementAnalysis.confidence > 0.7).length,
      mediumConfidence: scoredAchievements.filter(a => a.endorsementAnalysis.confidence > 0.4 && a.endorsementAnalysis.confidence <= 0.7).length,
      lowConfidence: scoredAchievements.filter(a => a.endorsementAnalysis.confidence <= 0.4).length
    }
  };
};