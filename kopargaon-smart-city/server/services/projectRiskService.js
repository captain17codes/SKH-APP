import postgresService from '../../mcp-server/services/postgresService.js';

// Configurable risk thresholds
const DEFAULT_THRESHOLDS = {
  LOW_MAX: 25,
  MEDIUM_MAX: 50,
  HIGH_MAX: 75
};

/**
 * Calculates geographical Haversine distance in meters between two [lat, lng] points
 */
const haversineMeters = (p1, p2) => {
  if (!p1 || !p2 || p1.length < 2 || p2.length < 2) return Infinity;
  const R = 6371000;
  const dLat = (p2[0] - p1[0]) * Math.PI / 180;
  const dLng = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Deterministic AI Risk Engine Service for Kopargaon Smart City Projects
 */
export const projectRiskService = {
  thresholds: { ...DEFAULT_THRESHOLDS },

  setThresholds: (customThresholds) => {
    projectRiskService.thresholds = { ...projectRiskService.thresholds, ...customThresholds };
  },

  /**
   * Deterministically analyze project risk based on 10 data points
   */
  calculateRisk: async (project, externalComplaints = []) => {
    // 1. Data Validation: Check for sufficient data
    const budget = Number(project.budget || 0);
    const spent = Number(project.spent || 0);
    const progress = Number(project.progress ?? -1);
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const expectedCompletion = (project.expectedCompletion || project.endDate) ? new Date(project.expectedCompletion || project.endDate) : null;

    if (!project || progress < 0 || budget <= 0 || !startDate || !expectedCompletion || isNaN(startDate.getTime()) || isNaN(expectedCompletion.getTime())) {
      return {
        risk: "UNKNOWN",
        score: 0,
        reasons: ["Insufficient project data for reliable risk analysis."],
        metrics: {
          elapsedPercentage: 0,
          expectedProgress: 0,
          actualProgress: progress >= 0 ? progress : 0,
          progressGap: 0,
          budgetUtilization: budget > 0 ? Math.round((spent / budget) * 100) : 0,
          budgetSpent: spent,
          totalBudget: budget,
          nearbyComplaintsCount: 0
        },
        recommendations: ["Ensure start date, expected completion date, budget, and reported progress are properly recorded."]
      };
    }

    // Special status handling
    const statusUpper = (project.status || '').toUpperCase();
    if (statusUpper === 'COMPLETED') {
      return {
        risk: "LOW",
        score: 0,
        reasons: ["Project is completed successfully."],
        metrics: {
          elapsedPercentage: 100,
          expectedProgress: 100,
          actualProgress: 100,
          progressGap: 0,
          budgetUtilization: Math.round((spent / budget) * 100),
          budgetSpent: spent,
          totalBudget: budget,
          nearbyComplaintsCount: 0
        },
        recommendations: ["Perform post-completion audit and handover."]
      };
    }

    if (statusUpper === 'CANCELLED') {
      return {
        risk: "UNKNOWN",
        score: 0,
        reasons: ["Project execution has been cancelled."],
        metrics: {
          elapsedPercentage: 0,
          expectedProgress: 0,
          actualProgress: progress,
          progressGap: 0,
          budgetUtilization: Math.round((spent / budget) * 100),
          budgetSpent: spent,
          totalBudget: budget,
          nearbyComplaintsCount: 0
        },
        recommendations: ["Re-evaluate project cancellation status or re-allocate unused funds."]
      };
    }

    // 2. Timeline & Elapsed Progress Calculations
    const now = new Date();
    const totalDurationMs = expectedCompletion.getTime() - startDate.getTime();
    const elapsedMs = Math.max(0, now.getTime() - startDate.getTime());
    
    let elapsedPercentage = 0;
    if (totalDurationMs > 0) {
      elapsedPercentage = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));
    }

    const expectedProgress = elapsedPercentage;
    const actualProgress = progress;
    const progressGap = actualProgress - expectedProgress;

    // 3. Financial / Budget Utilization Calculations
    const budgetUtilization = Math.round((spent / budget) * 100);
    const financialVariance = budgetUtilization - actualProgress;

    // 4. Proximity Complaints & Repeated Issues Calculations
    let nearbyComplaints = [];
    try {
      if (Array.isArray(externalComplaints) && externalComplaints.length > 0) {
        nearbyComplaints = externalComplaints;
      } else if (postgresService && typeof postgresService.getNearbyComplaints === 'function') {
        nearbyComplaints = await postgresService.getNearbyComplaints(project);
      }
    } catch {
      nearbyComplaints = [];
    }

    // Filter complaints within ~1km radius or matching ward
    const projectCoords = project.coordinates || (project.geometry?.type === 'Point' ? [project.geometry.coordinates[1], project.geometry.coordinates[0]] : null);
    
    let nearbyUnresolvedCount = 0;
    const categoryCounts = {};

    for (const cmp of nearbyComplaints) {
      const cmpStatus = (cmp.status || '').toUpperCase();
      if (cmpStatus !== 'RESOLVED' && cmpStatus !== 'REJECTED') {
        let isNearby = false;
        if (projectCoords && cmp.coordinates) {
          const dist = haversineMeters(projectCoords, cmp.coordinates);
          if (dist <= 1000) isNearby = true;
        } else if (project.ward && cmp.ward && project.ward.toLowerCase().includes(cmp.ward.toLowerCase())) {
          isNearby = true;
        }

        if (isNearby) {
          nearbyUnresolvedCount++;
          const cat = cmp.category || 'General';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      }
    }

    let hasRepeatedComplaints = false;
    for (const cat in categoryCounts) {
      if (categoryCounts[cat] >= 2) {
        hasRepeatedComplaints = true;
        break;
      }
    }

    // 5. Deterministic Score Accumulation (0 to 100 max)
    let score = 0;
    const reasons = [];

    // Factor A: Schedule Delay (Progress Gap)
    if (progressGap < 0) {
      const delayMagnitude = Math.abs(progressGap);
      if (delayMagnitude >= 30) {
        score += 35;
        reasons.push(`Progress is severely behind expected schedule (Gap: ${progressGap}%)`);
      } else if (delayMagnitude >= 15) {
        score += 25;
        reasons.push(`Progress is significantly behind expected schedule (Gap: ${progressGap}%)`);
      } else if (delayMagnitude >= 5) {
        score += 15;
        reasons.push(`Progress is moderately behind expected schedule (Gap: ${progressGap}%)`);
      }
    }

    // Factor B: Budget Utilization vs Physical Progress
    if (financialVariance > 25) {
      score += 25;
      reasons.push(`Budget utilization (${budgetUtilization}%) is significantly higher than reported physical progress (${actualProgress}%)`);
    } else if (financialVariance > 10) {
      score += 15;
      reasons.push(`Budget utilization (${budgetUtilization}%) is moderately higher than reported physical progress (${actualProgress}%)`);
    }

    // Factor C: Explicit Status
    if (statusUpper === 'DELAYED') {
      score += 20;
      reasons.push("Project status is explicitly marked as DELAYED");
    }

    // Factor D: Proximity Grievances & Unresolved Complaints
    if (nearbyUnresolvedCount >= 10) {
      score += 20;
      reasons.push(`High complaint concentration (${nearbyUnresolvedCount} unresolved grievances) near project area`);
    } else if (nearbyUnresolvedCount >= 4) {
      score += 12;
      reasons.push(`Moderate complaint concentration (${nearbyUnresolvedCount} unresolved grievances) near project area`);
    } else if (nearbyUnresolvedCount >= 1) {
      score += 5;
      reasons.push(`Unresolved citizen complaints detected near project area (${nearbyUnresolvedCount} cases)`);
    }

    // Factor E: Repeated Complaints
    if (hasRepeatedComplaints) {
      score += 10;
      reasons.push("Repeated grievances detected in same service category near project site");
    }

    // Factor F: Category Complexity & Overdue Time
    if (now > expectedCompletion) {
      score += 15;
      reasons.push("Project has surpassed its expected completion target date");
    }

    // Cap score at 100
    score = Math.min(100, score);

    // 6. Assign Risk Category Level based on Deterministic Thresholds
    let risk = "LOW";
    if (score > projectRiskService.thresholds.HIGH_MAX) {
      risk = "CRITICAL";
    } else if (score > projectRiskService.thresholds.MEDIUM_MAX) {
      risk = "HIGH";
    } else if (score > projectRiskService.thresholds.LOW_MAX) {
      risk = "MEDIUM";
    }

    // Generate Standard Neutral Recommendations
    const recommendations = [];
    if (progressGap < -10 || statusUpper === 'DELAYED') {
      recommendations.push("Review project schedule and investigate causes of delay");
      recommendations.push("Verify reported physical progress through site inspection");
      recommendations.push("Reassess expected completion date");
    }
    if (financialVariance > 15) {
      recommendations.push("Review remaining budget allocation against remaining work");
    }
    if (nearbyUnresolvedCount > 0) {
      recommendations.push("Check nearby complaint concentration and resolve site issues");
      recommendations.push("Review pending issues with assigned ward engineers");
    }
    if (recommendations.length === 0) {
      recommendations.push("Maintain standard progress monitoring and milestone tracking");
    }

    if (reasons.length === 0) {
      reasons.push("Project execution is operating within normal variance parameters.");
    }

    return {
      risk,
      score,
      reasons,
      metrics: {
        elapsedPercentage,
        expectedProgress,
        actualProgress,
        progressGap,
        budgetUtilization,
        budgetSpent: spent,
        totalBudget: budget,
        nearbyComplaintsCount: nearbyUnresolvedCount
      },
      recommendations
    };
  }
};

export default projectRiskService;
