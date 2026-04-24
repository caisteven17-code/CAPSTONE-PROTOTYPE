'use client';


import { FinancialRecord, FinancialHealthScore, DiagnosticResult, EntityClass, Project, Donation, ProjectExpense } from '../types';
import { ALL_PARISHES, INITIAL_SEMINARIES, INITIAL_SCHOOLS } from '../constants';

export const DEFAULT_RECORDS: FinancialRecord[] = [
  { month: 'Jan', collections: 800000, consumableCollections: 650000, disbursements: 640000, entityId: 'default', entityType: 'parish' },
  { month: 'Feb', collections: 720000, consumableCollections: 580000, disbursements: 610000, entityId: 'default', entityType: 'parish' },
  { month: 'Mar', collections: 740000, consumableCollections: 600000, disbursements: 620000, entityId: 'default', entityType: 'parish' },
  { month: 'Apr', collections: 950000, consumableCollections: 780000, disbursements: 680000, entityId: 'default', entityType: 'parish' }, // Easter
  { month: 'May', collections: 820000, consumableCollections: 670000, disbursements: 650000, entityId: 'default', entityType: 'parish' },
  { month: 'Jun', collections: 760000, consumableCollections: 610000, disbursements: 630000, entityId: 'default', entityType: 'parish' },
  { month: 'Jul', collections: 730000, consumableCollections: 590000, disbursements: 620000, entityId: 'default', entityType: 'parish' },
  { month: 'Aug', collections: 750000, consumableCollections: 600000, disbursements: 620000, entityId: 'default', entityType: 'parish' },
  { month: 'Sep', collections: 760000, consumableCollections: 610000, disbursements: 625000, entityId: 'default', entityType: 'parish' },
  { month: 'Oct', collections: 770000, consumableCollections: 620000, disbursements: 630000, entityId: 'default', entityType: 'parish' },
  { month: 'Nov', collections: 780000, consumableCollections: 630000, disbursements: 635000, entityId: 'default', entityType: 'parish' },
  { month: 'Dec', collections: 1100000, consumableCollections: 900000, disbursements: 750000, entityId: 'default', entityType: 'parish' }, // Christmas
];

const STORAGE_KEY = 'financial_records';
const HEALTH_KEY = 'health_scores';
const DIAGNOSTIC_KEY = 'diagnostics';
const PROJECTS_KEY = 'projects';

const DIOCESAN_INSTITUTIONS_DATA: Record<string, any> = {
  // Default IDs (for when no specific entity is logged in)
  'default': { type: 'parish', score: 83, dimensions: { liquidity: 89, sustainability: 100, efficiency: 78, stability: 40, growth: 99 } },
  'parish_01': { type: 'parish', score: 83, dimensions: { liquidity: 89, sustainability: 100, efficiency: 78, stability: 40, growth: 99 } },
  'school_01': { type: 'school', score: 76, dimensions: { liquidity: 78, sustainability: 82, efficiency: 75, stability: 70, growth: 75 } },
  'seminary_01': { type: 'seminary', score: 72, dimensions: { liquidity: 70, sustainability: 75, efficiency: 85, stability: 65, growth: 68 } },
  
  'San Pablo Cathedral': { type: 'parish', score: 91.4, dimensions: { liquidity: 88, sustainability: 92, efficiency: 90, stability: 95, growth: 94 } },
  'San Isidro Labrador (Biñan)': { type: 'parish', score: 88.7, dimensions: { liquidity: 85, sustainability: 88, efficiency: 86, stability: 92, growth: 98 } },
  'St. John the Baptist (Calamba)': { type: 'parish', score: 86.2, dimensions: { liquidity: 82, sustainability: 84, efficiency: 85, stability: 94, growth: 92 } },
  'St. Polycarp (Cabuyao)': { type: 'parish', score: 84.5, dimensions: { liquidity: 78, sustainability: 86, efficiency: 82, stability: 90, growth: 95 } },
  'Immaculate Conception (Los Baños)': { type: 'parish', score: 82.9, dimensions: { liquidity: 80, sustainability: 82, efficiency: 80, stability: 88, growth: 85 } },
  'St. Rose of Lima (Sta. Rosa)': { type: 'parish', score: 81.1, dimensions: { liquidity: 75, sustainability: 85, efficiency: 78, stability: 86, growth: 90 } },
  'Holy Family Parish (Sta. Rosa)': { type: 'parish', score: 79.8, dimensions: { liquidity: 72, sustainability: 80, efficiency: 84, stability: 85, growth: 88 } },
  'San Antonio de Padua (Pila)': { type: 'parish', score: 78.3, dimensions: { liquidity: 76, sustainability: 78, efficiency: 75, stability: 82, growth: 84 } },
  'St. Augustine (Bay)': { type: 'parish', score: 77.0, dimensions: { liquidity: 74, sustainability: 75, efficiency: 76, stability: 84, growth: 82 } },
  'St. Sebastian (Lumban)': { type: 'parish', score: 75.6, dimensions: { liquidity: 70, sustainability: 74, efficiency: 72, stability: 80, growth: 92 } },
  'St. James the Apostle (Paete)': { type: 'parish', score: 44.8, dimensions: { liquidity: 55, sustainability: 35, efficiency: 40, stability: 60, growth: 42 } },
  'St. Gregory the Great (Majayjay)': { type: 'parish', score: 42.1, dimensions: { liquidity: 52, sustainability: 32, efficiency: 38, stability: 55, growth: 45 } },
  'St. Bartholomew (Nagcarlan)': { type: 'parish', score: 39.5, dimensions: { liquidity: 48, sustainability: 30, efficiency: 35, stability: 52, growth: 40 } },
  'St. Mary Magdalene (Magdalena)': { type: 'parish', score: 37.2, dimensions: { liquidity: 45, sustainability: 28, efficiency: 32, stability: 50, growth: 38 } },
  'St. John the Baptist (Liliw)': { type: 'parish', score: 35.4, dimensions: { liquidity: 42, sustainability: 25, efficiency: 34, stability: 48, growth: 35 } },
  'St. Peter of Alcantara (Pakil)': { type: 'parish', score: 33.1, dimensions: { liquidity: 40, sustainability: 22, efficiency: 30, stability: 45, growth: 32 } },
  'Our Lady of Holy Rosary (Luisiana)': { type: 'parish', score: 31.8, dimensions: { liquidity: 38, sustainability: 20, efficiency: 28, stability: 42, growth: 48 } },
  'St. Sebastian (Famy)': { type: 'parish', score: 29.5, dimensions: { liquidity: 35, sustainability: 18, efficiency: 25, stability: 40, growth: 42 } },
  'St. Joseph the Worker (Cavinti)': { type: 'parish', score: 27.2, dimensions: { liquidity: 32, sustainability: 16, efficiency: 22, stability: 38, growth: 40 } },
  'Our Lady of Nativity (Pangil)': { type: 'parish', score: 25.1, dimensions: { liquidity: 30, sustainability: 15, efficiency: 20, stability: 35, growth: 28 } },
  'San Lorenzo Ruiz (San Pablo)': { type: 'parish', score: 18.5, dimensions: { liquidity: 20, sustainability: 10, efficiency: 15, stability: 25, growth: 12 } },
  'St. Therese of the Child Jesus (Los Baños)': { type: 'parish', score: 95.2, dimensions: { liquidity: 94, sustainability: 96, efficiency: 92, stability: 98, growth: 95 } },
  'Liceo de San Pablo': { type: 'school', score: 69.4, dimensions: { liquidity: 72, sustainability: 70, efficiency: 68, stability: 70, growth: 65 } },
  'Liceo de Calamba': { type: 'school', score: 66.7, dimensions: { liquidity: 68, sustainability: 65, efficiency: 65, stability: 68, growth: 72 } },
  'Liceo de Cabuyao': { type: 'school', score: 63.5, dimensions: { liquidity: 65, sustainability: 62, efficiency: 62, stability: 65, growth: 60 } },
  'Liceo de Los Baños': { type: 'school', score: 60.2, dimensions: { liquidity: 62, sustainability: 60, efficiency: 58, stability: 62, growth: 58 } },
  'Liceo de Bay': { type: 'school', score: 57.8, dimensions: { liquidity: 60, sustainability: 58, efficiency: 55, stability: 60, growth: 55 } },
  "St. Peter's College Seminary": { type: 'seminary', score: 59.3, dimensions: { liquidity: 58, sustainability: 52, efficiency: 92, stability: 45, growth: 18 } },
  'San Pablo Formation House': { type: 'seminary', score: 56.1, dimensions: { liquidity: 55, sustainability: 48, efficiency: 90, stability: 42, growth: 15 } },
  'Diocesan Memorial Seminary': { type: 'seminary', score: 53.4, dimensions: { liquidity: 52, sustainability: 45, efficiency: 88, stability: 40, growth: 12 } },
  'Holy Cross Seminary': { type: 'seminary', score: 50.2, dimensions: { liquidity: 50, sustainability: 42, efficiency: 86, stability: 38, growth: 10 } },
  'Our Lady of Guadalupe Seminary': { type: 'seminary', score: 47.5, dimensions: { liquidity: 48, sustainability: 40, efficiency: 85, stability: 35, growth: 8 } },
};

const getStoredRecords = (): FinancialRecord[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveStoredRecords = (records: FinancialRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const getStoredProjects = (): Project[] => {
  const stored = localStorage.getItem(PROJECTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveStoredProjects = (projects: Project[]) => {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
};

function getStoredDonations(): Donation[] {
  const stored = localStorage.getItem('donations');
  return stored ? JSON.parse(stored) : [];
}

function saveStoredDonations(donations: Donation[]) {
  localStorage.setItem('donations', JSON.stringify(donations));
}

function getStoredExpenses(): ProjectExpense[] {
  const stored = localStorage.getItem('project_expenses');
  return stored ? JSON.parse(stored) : [];
}

function saveStoredExpenses(expenses: ProjectExpense[]) {
  localStorage.setItem('project_expenses', JSON.stringify(expenses));
}

export const dataService = {
  async getRecords(entityId: string, entityType: 'parish' | 'seminary' | 'school', entityClass?: EntityClass): Promise<FinancialRecord[]> {
    const records = getStoredRecords();
    const filtered = records.filter(r => r.entityId === entityId && r.entityType === entityType);
    
    if (filtered.length > 0) return filtered;

    // Generate unique mock data based on entityId to avoid everyone having the same score
    // Use a robust hash for the seed
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    };

    const seed = hashString(entityId);

    // Use a more varied pseudo-random function
    const pseudoRandom = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // Base multiplier for volume (0.1 to 10.0)
    let baseMultiplier = 0.1 + (pseudoRandom(seed) * 9.9);
    
    // Entity-specific health profile (0.2 to 2.0) - wider range for more variety
    let healthProfile = 0.2 + (pseudoRandom(seed + 123) * 1.8);

    // If it's one of our specific institutions, adjust healthProfile to match target score
    if (DIOCESAN_INSTITUTIONS_DATA[entityId]) {
      const targetScore = DIOCESAN_INSTITUTIONS_DATA[entityId].score;
      // Rough mapping: score 25 -> profile 0.3, score 95 -> profile 1.8
      healthProfile = 0.3 + ((targetScore - 25) / 70) * 1.5;
    }
    
    // Adjust factors based on entity class if provided
    let classBonus = 0;
    if (entityClass === 'Class A') {
      classBonus = 0.3;
      baseMultiplier *= 2.0;
    } else if (entityClass === 'Class B') {
      classBonus = 0.15;
      baseMultiplier *= 1.4;
    } else if (entityClass === 'Class C') {
      classBonus = 0;
      baseMultiplier *= 1.0;
    } else if (entityClass === 'Class D') {
      classBonus = -0.15;
      baseMultiplier *= 0.7;
    } else if (entityClass === 'Class E') {
      classBonus = -0.3;
      baseMultiplier *= 0.4;
    }

    // Efficiency factor (ratio between collections and disbursements)
    // Target ratio: 1.0 / healthProfile. 
    // High healthProfile -> low efficiencyFactor -> low expenses -> high score
    const efficiencyFactor = (1.0 / healthProfile) + (pseudoRandom(seed + 456) * 0.5) - classBonus; 
    
    // Sustainability factor (ratio for consumable collections)
    const sustainabilityFactor = (0.7 * healthProfile) + (pseudoRandom(seed + 789) * 0.4) + classBonus; 
    
    // Determine a "Fiesta Month" for this parish (random month between Jan-Nov)
    const fiestaMonthIdx = Math.floor(pseudoRandom(seed + 999) * 11);
    const fiestaMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const fiestaMonth = fiestaMonths[fiestaMonthIdx];

    return DEFAULT_RECORDS.map((r, i) => {
      const monthSeed = seed + i;
      // Per-month variance (0.7 to 1.3)
      let colVar = 0.7 + (pseudoRandom(monthSeed) * 0.6); 
      let disVar = 0.8 + (pseudoRandom(monthSeed + 100) * 0.4); 
      
      // Apply seasonality
      if (r.month === fiestaMonth) {
        colVar *= 2.0; // Fiesta spike in collections
        disVar *= 1.5; // Fiesta spike in expenses
      }

      // School specific patterns
      if (entityType === 'school') {
        if (r.month === 'Jun' || r.month === 'Nov') {
          colVar *= 3.0; // Enrollment/Tuition spikes
        } else if (r.month === 'Apr' || r.month === 'May') {
          colVar *= 0.3; // Summer break
        }
      }

      // Seminary specific patterns
      if (entityType === 'seminary') {
        if (r.month === 'Aug') colVar *= 1.8; // Start of year donations
      }

      // Random anomaly (10% chance)
      if (pseudoRandom(monthSeed + 500) > 0.90) {
        if (pseudoRandom(monthSeed + 600) > 0.5) {
          colVar *= 1.7; // Unexpected donation
        } else {
          disVar *= 2.0; // Unexpected repair/expense
        }
      }

      const collections = Math.round(r.collections * baseMultiplier * colVar);
      const consumableCollections = Math.round(r.consumableCollections * baseMultiplier * sustainabilityFactor * (0.8 + pseudoRandom(monthSeed + 200) * 0.4));
      const disbursements = Math.round(r.disbursements * baseMultiplier * efficiencyFactor * disVar);

      // Generate detailed fields based on the main values
      const sacraments_rate = Math.round(collections * 0.15);
      const sacraments_arancel = Math.round(collections * 0.10);
      const sacraments_parishShare = Math.round(collections * 0.08);
      const sacraments_overAbove = Math.round(collections * 0.05);
      
      const collections_mass = Math.round(collections * 0.40);
      const collections_other = Math.round(collections * 0.12);
      const collections_otherReceipts = Math.round(collections * 0.10);
      
      const expenses_pastoral = Math.round(disbursements * 0.35);
      const expenses_parish = Math.round(disbursements * 0.65);
      
      const netReceipts = collections - disbursements;
      
      const others_massIntentionsNotClaimed = Math.round(collections * 0.02);
      const others_massIntentionsClaimed = Math.round(collections * 0.03);
      const others_specialCollections = Math.round(collections * 0.05);
      
      const pastoralParishFundTotalNetReceipts = netReceipts * 0.8;

      return {
        ...r,
        entityId,
        entityType,
        entityClass,
        collections,
        consumableCollections,
        disbursements,
        sacraments_rate,
        sacraments_arancel,
        sacraments_parishShare,
        sacraments_overAbove,
        collections_mass,
        collections_other,
        collections_otherReceipts,
        expenses_pastoral,
        expenses_parish,
        netReceipts,
        others_massIntentionsNotClaimed,
        others_massIntentionsClaimed,
        others_specialCollections,
        pastoralParishFundTotalNetReceipts
      };
    });
  },

  async calculateHealthScore(entityId: string, entityType: 'parish' | 'seminary' | 'school', entityClass?: EntityClass): Promise<FinancialHealthScore> {
    // Check if we have hardcoded data for this institution
    if (DIOCESAN_INSTITUTIONS_DATA[entityId]) {
      const data = DIOCESAN_INSTITUTIONS_DATA[entityId];
      // Use a stable pseudo-random for percentage change based on entityId
      const hashString = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash |= 0;
        }
        return hash;
      };
      const seed = hashString(entityId);
      const pseudoRandom = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
      };
      
      // Generate analysis for hardcoded data
      let analysis = '';
      const recommendations: string[] = [];
      const compositeScore = Math.round(data.score);

      if (compositeScore >= 80) {
        analysis = `Excellent financial health. The ${entityType} shows strong liquidity and sustainable practices.`;
        recommendations.push('Consider expanding mission outreach programs.', 'Maintain current reserves.');
      } else if (compositeScore >= 60) {
        analysis = `Good financial health with some areas for optimization. The ${entityType} is stable but could improve efficiency.`;
        recommendations.push('Review discretionary spending.', 'Optimize collection processes.');
      } else if (compositeScore >= 40) {
        analysis = `Fair financial health. There are concerns regarding sustainability and liquidity that need attention.`;
        recommendations.push('Implement stricter budget controls.', 'Seek additional revenue streams.');
      } else {
        analysis = `Critical financial health. Immediate intervention is required to ensure the ${entityType}'s operational stability.`;
        recommendations.push('Urgent financial audit recommended.', 'Suspend non-essential disbursements.');
      }

      return {
        entityId,
        entityType,
        entityClass,
        compositeScore,
        dimensions: data.dimensions,
        trend: data.score > 70 ? 'up' : data.score < 40 ? 'down' : 'stable',
        percentageChange: (pseudoRandom(seed) * 10) - 5,
        analysis,
        recommendations,
        timestamp: new Date().toISOString()
      };
    }

    const records = await this.getRecords(entityId, entityType, entityClass);
    if (records.length === 0) return this.getDefaultHealthScore(entityId, entityType);

    // Calculate averages for more stable health score based on collections and disbursements
    const totalCollections = records.reduce((sum, r) => sum + r.collections, 0);
    const totalDisbursements = records.reduce((sum, r) => sum + r.disbursements, 0);
    const totalConsumable = records.reduce((sum, r) => sum + r.consumableCollections, 0);
    
    const avgCollections = totalCollections / records.length;
    const avgDisbursements = totalDisbursements / records.length;
    const avgConsumable = totalConsumable / records.length;

    const latest = records[records.length - 1];
    const prev = records.length > 1 ? records[records.length - 2] : latest;

    // 1. Liquidity (30%) - Based on average collections vs disbursements ratio
    // Target ratio: 1.5+ for 100 score. 1.0 is 50 score. 0.5 is 0 score.
    const liquidityRatio = avgCollections / (avgDisbursements || 1);
    const liquidity = Math.min(100, Math.max(0, (liquidityRatio - 0.5) * 100));
    
    // 2. Sustainability (25%) - Reserve adequacy (Consumable collections vs disbursements)
    // Target ratio: 1.2+ for 100 score. 0.8 is 50 score. 0.4 is 0 score.
    const sustainabilityRatio = avgConsumable / (avgDisbursements || 1);
    const sustainability = Math.min(100, Math.max(0, (sustainabilityRatio - 0.4) * 125));
    
    // 3. Efficiency (20%) - Expense-to-income ratio (Disbursements / Collections)
    // Target: 0.5 ratio for 100 score. 1.0 ratio for 50 score. 1.5 ratio for 0 score.
    const efficiencyRatio = avgDisbursements / (avgCollections || 1);
    const efficiency = Math.min(100, Math.max(0, 100 - (efficiencyRatio - 0.5) * 100));
    
    // 4. Stability (15%) - Income volatility (Coefficient of variation)
    const stdDev = Math.sqrt(records.reduce((sum, r) => sum + Math.pow(r.collections - avgCollections, 2), 0) / records.length);
    const cv = stdDev / (avgCollections || 1);
    const stability = Math.min(100, Math.max(0, 100 - cv * 250)); // Adjusted sensitivity
    
    // 5. Growth (10%) - MoM improvement
    const growthRate = (latest.collections - prev.collections) / (prev.collections || 1);
    const growth = Math.min(100, Math.max(0, 50 + growthRate * 500)); // Adjusted sensitivity

    const compositeScore = Math.round(
      Math.min(100, Math.max(0, 
        (liquidity * 0.3) + 
        (sustainability * 0.25) + 
        (efficiency * 0.2) + 
        (stability * 0.15) + 
        (growth * 0.1)
      ))
    );

    // Generate simple analysis
    let analysis = '';
    const recommendations: string[] = [];

    if (compositeScore >= 80) {
      analysis = `Excellent financial health. The ${entityType} shows strong liquidity and sustainable practices.`;
      recommendations.push('Consider expanding mission outreach programs.', 'Maintain current reserves.');
    } else if (compositeScore >= 60) {
      analysis = `Good financial health with some areas for optimization. The ${entityType} is stable but could improve efficiency.`;
      recommendations.push('Review discretionary spending.', 'Optimize collection processes.');
    } else if (compositeScore >= 40) {
      analysis = `Fair financial health. There are concerns regarding sustainability and liquidity that need attention.`;
      recommendations.push('Implement stricter budget controls.', 'Seek additional revenue streams.');
    } else {
      analysis = `Critical financial health. Immediate intervention is required to ensure the ${entityType}'s operational stability.`;
      recommendations.push('Urgent financial audit recommended.', 'Suspend non-essential disbursements.');
    }

    // Add dimension-specific analysis
    if (liquidity < 50) analysis += ' Liquidity is a major concern.';
    if (efficiency < 50) analysis += ' Operational efficiency is below target.';
    if (growthRate < 0) analysis += ' Recent collections show a downward trend.';

    return {
      entityId,
      entityType,
      entityClass,
      compositeScore,
      dimensions: {
        liquidity: Math.round(liquidity),
        sustainability: Math.round(sustainability),
        efficiency: Math.round(efficiency),
        stability: Math.round(stability),
        growth: Math.round(growth)
      },
      trend: compositeScore > 70 ? 'up' : compositeScore < 40 ? 'down' : 'stable',
      percentageChange: growthRate * 100,
      analysis,
      recommendations,
      timestamp: new Date().toISOString()
    };
  },

  getDefaultHealthScore(entityId: string, entityType: any): FinancialHealthScore {
    return {
      entityId,
      entityType,
      compositeScore: 72,
      dimensions: {
        liquidity: 75,
        sustainability: 68,
        efficiency: 82,
        stability: 65,
        growth: 55
      },
      trend: 'stable',
      percentageChange: 2.4,
      timestamp: new Date().toISOString()
    };
  },

  async getDiagnostic(entityId: string, month: string): Promise<DiagnosticResult> {
    const records = await this.getRecords(entityId, 'parish');
    const target = records.find(r => r.month === month) || records[records.length - 1];
    
    // Simple heuristic for anomaly detection
    const avgCollections = records.reduce((sum, r) => sum + r.collections, 0) / records.length;
    const avgDisbursements = records.reduce((sum, r) => sum + r.disbursements, 0) / records.length;
    
    const isCollectionAnomaly = Math.abs(target.collections - avgCollections) / avgCollections > 0.2;
    const isDisbursementAnomaly = Math.abs(target.disbursements - avgDisbursements) / avgDisbursements > 0.2;

    if (!isCollectionAnomaly && !isDisbursementAnomaly) {
      return {
        entityId,
        targetMonth: month,
        anomalyDetected: false,
        timestamp: new Date().toISOString()
      };
    }

    // Return diagnostic analysis based on heuristics
    return {
      entityId,
      targetMonth: month,
      anomalyDetected: true,
      anomalyType: isDisbursementAnomaly ? 'High Disbursements' : 'Collection Fluctuation',
      severity: 'medium',
      rootCauses: [
        { factor: isDisbursementAnomaly ? 'Unexpected Maintenance' : 'Seasonal Variation', contribution: 60 },
        { factor: 'Economic Factors', contribution: 40 }
      ],
      confidenceScore: 85,
      analysis: `Significant deviation from average ${isDisbursementAnomaly ? 'disbursements' : 'collections'} detected. Likely due to ${isDisbursementAnomaly ? 'unplanned expenses' : 'seasonal trends'}.`,
      timestamp: new Date().toISOString()
    };
  },

  async saveRecord(record: FinancialRecord) {
    const records = getStoredRecords();
    if (record.id) {
      const index = records.findIndex(r => r.id === record.id);
      if (index !== -1) {
        records[index] = { ...record, timestamp: Date.now() };
      } else {
        records.push({ ...record, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() });
      }
    } else {
      records.push({ ...record, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() });
    }
    saveStoredRecords(records);
    // Trigger a fake update for subscribers
    window.dispatchEvent(new Event('storage_update'));
  },

  async saveRecords(records: FinancialRecord[]) {
    for (const record of records) {
      await this.saveRecord(record);
    }
  },

  async deleteRecord(id: string) {
    const records = getStoredRecords();
    const filtered = records.filter(r => r.id !== id);
    saveStoredRecords(filtered);
    window.dispatchEvent(new Event('storage_update'));
  },

  async getAllRecords(): Promise<FinancialRecord[]> {
    const records = getStoredRecords();
    if (records.length > 0) return records;

    // Combine all institutions from constants and the mock data
    const entities: { id: string, type: 'parish' | 'seminary' | 'school', class: EntityClass }[] = [];
    
    // Add from ALL_PARISHES
    ALL_PARISHES.forEach(p => {
      entities.push({
        id: p.name,
        type: 'parish',
        class: p.class as EntityClass
      });
    });

    // Add from INITIAL_SEMINARIES
    INITIAL_SEMINARIES.forEach(s => {
      entities.push({
        id: s.name,
        type: 'seminary',
        class: s.class as EntityClass
      });
    });

    // Add from INITIAL_SCHOOLS
    INITIAL_SCHOOLS.forEach(s => {
      entities.push({
        id: s.name,
        type: 'school',
        class: s.class as EntityClass
      });
    });

    // Add from DIOCESAN_INSTITUTIONS_DATA (to ensure legacy mock data is still there)
    Object.entries(DIOCESAN_INSTITUTIONS_DATA).forEach(([name, data]) => {
      // Avoid duplicates
      if (!entities.find(e => e.id === name)) {
        let entityClass: EntityClass = 'Class C';
        if (data.score > 85) entityClass = 'Class A';
        else if (data.score > 75) entityClass = 'Class B';
        else if (data.score < 35) entityClass = 'Class E';
        else if (data.score < 45) entityClass = 'Class D';

        entities.push({
          id: name,
          type: data.type,
          class: entityClass
        });
      }
    });

    const allMockRecords: FinancialRecord[] = [];
    for (const entity of entities) {
      const entityRecords = await this.getRecords(entity.id, entity.type, entity.class);
      allMockRecords.push(...entityRecords);
    }
    return allMockRecords;
  },

  subscribeToRecords(entityId: string, entityType: string, callback: (records: FinancialRecord[]) => void) {
    const update = async () => {
      const records = await this.getRecords(entityId, entityType as any);
      callback(records);
    };
    
    window.addEventListener('storage_update', update);
    update();
    
    return () => window.removeEventListener('storage_update', update);
  },

  subscribeToAllRecords(callback: (records: FinancialRecord[]) => void) {
    const update = async () => {
      const records = await this.getAllRecords();
      callback(records);
    };
    
    window.addEventListener('storage_update', update);
    update();
    
    return () => window.removeEventListener('storage_update', update);
  },

  parseCSV(csvText: string, entityId: string = 'default', entityType: any = 'parish'): FinancialRecord[] {
    const lines = csvText.split('\n');
    const records: FinancialRecord[] = [];
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [month, collections, consumableCollections, disbursements] = line.split(',');
      records.push({
        month: month.trim(),
        collections: parseFloat(collections) || 0,
        consumableCollections: parseFloat(consumableCollections) || 0,
        disbursements: parseFloat(disbursements) || 0,
        entityId,
        entityType
      });
    }
    
    return records;
  },

  generateTemplateCSV(entityType: string = 'parish'): string {
    if (entityType === 'seminary') {
      const header = 'Month,Enrollment,Capacity,Staff,Collections,Disbursements\n';
      const rows = DEFAULT_RECORDS.map(r => 
        `${r.month},${Math.floor(Math.random() * 50)},60,8,${r.collections},${r.disbursements}`
      ).join('\n');
      return header + rows;
    } else if (entityType === 'school') {
      const header = 'Month,Enrollment,Capacity,Staff,Level,Collections,Disbursements\n';
      const rows = DEFAULT_RECORDS.map(r => 
        `${r.month},${Math.floor(Math.random() * 1000)},1500,45,K-12,${r.collections},${r.disbursements}`
      ).join('\n');
      return header + rows;
    } else if (entityType === 'diocese') {
      const header = 'Month,General Fund,Mission Fund,Cemetery Fund,Total Income,Total Expenses\n';
      const rows = DEFAULT_RECORDS.map(r => 
        `${r.month},${r.collections * 0.6},${r.collections * 0.2},${r.collections * 0.2},${r.collections},${r.disbursements}`
      ).join('\n');
      return header + rows;
    } else {
      const header = 'Month,Collections / Receipts,Consumable Collections,Disbursements\n';
      const rows = DEFAULT_RECORDS.map(r => 
        `${r.month},${r.collections},${r.consumableCollections},${r.disbursements}`
      ).join('\n');
      return header + rows;
    }
  },

  async getProjects(entityId?: string, entityType?: string): Promise<Project[]> {
    let projects = getStoredProjects();
    
    if (entityId && entityType) {
      if (entityType === 'diocese') {
        return projects; // Bishop sees everything
      }
      return projects.filter(p => p.entityId === entityId && p.entityType === entityType);
    }
    
    if (entityId) {
      return projects.filter(p => p.entityId === entityId);
    }
    
    if (entityType) {
      if (entityType === 'diocese') {
        return projects; // Bishop sees everything
      }
      return projects.filter(p => p.entityType === entityType);
    }

    return projects;
  },

  async getDonations(projectId?: string): Promise<Donation[]> {
    let donations = getStoredDonations();
    
    if (projectId) {
      return donations.filter(d => d.projectId === projectId);
    }

    return donations;
  },

  async getExpenses(projectId?: string): Promise<ProjectExpense[]> {
    const expenses = getStoredExpenses();

    if (projectId) {
      return expenses.filter((expense) => expense.projectId === projectId);
    }

    return expenses;
  },

  async saveDonation(donation: Donation) {
    const donations = getStoredDonations();
    donations.push({ ...donation, id: donation.id || Math.random().toString(36).substr(2, 9) });
    saveStoredDonations(donations);
    window.dispatchEvent(new Event('donations_update'));
  },

  async saveExpense(expense: ProjectExpense) {
    const expenses = getStoredExpenses();
    expenses.push({ ...expense, id: expense.id || Math.random().toString(36).substr(2, 9) });
    saveStoredExpenses(expenses);
    window.dispatchEvent(new Event('expenses_update'));
  },

  subscribeToDonations(callback: (donations: Donation[]) => void, projectId?: string) {
    const update = async () => {
      const donations = await this.getDonations(projectId);
      callback(donations);
    };
    
    window.addEventListener('donations_update', update);
    update();
    
    return () => window.removeEventListener('donations_update', update);
  },

  subscribeToExpenses(callback: (expenses: ProjectExpense[]) => void, projectId?: string) {
    const update = async () => {
      const expenses = await this.getExpenses(projectId);
      callback(expenses);
    };

    window.addEventListener('expenses_update', update);
    update();

    return () => window.removeEventListener('expenses_update', update);
  },

  async saveProject(project: Project) {
    const projects = getStoredProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      projects[index] = project;
    } else {
      projects.push({ ...project, id: project.id || Math.random().toString(36).substr(2, 9) });
    }
    saveStoredProjects(projects);
    window.dispatchEvent(new Event('projects_update'));
  },

  async deleteProject(id: string) {
    const projects = getStoredProjects();
    const filtered = projects.filter(p => p.id !== id);
    saveStoredProjects(filtered);
    window.dispatchEvent(new Event('projects_update'));
  },

  subscribeToProjects(callback: (projects: Project[]) => void, entityId?: string, entityType?: string) {
    const update = async () => {
      const projects = await this.getProjects(entityId, entityType);
      callback(projects);
    };
    
    window.addEventListener('projects_update', update);
    update();
    
    return () => window.removeEventListener('projects_update', update);
  }
};
