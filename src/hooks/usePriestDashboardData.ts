'use client';

import { useState, useMemo, useEffect } from 'react';
import { FinancialRecord, FinancialHealthScore, DiagnosticResult } from '../types';
import { dataService } from '../services/dataService';
import { auth } from '../firebase';

export function usePriestDashboardData(entityId: string | undefined, entityType?: 'parish' | 'seminary' | 'school', entityClass?: string) {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userEntityInfo = useMemo(() => {
    const user = auth.currentUser;
    if (!user) return { id: 'default', type: 'parish' as const, name: 'San Isidro Labrador Parish', class: 'Class A' };
    
    // In a real app, this would come from user profile
    const email = user.email || '';
    if (email.includes('school')) return { id: 'school_01', type: 'school' as const, name: 'St. Jude Catholic School', class: 'Class A' };
    if (email.includes('seminary')) return { id: 'seminary_01', type: 'seminary' as const, name: 'Holy Rosary Seminary', class: 'Class B' };
    return { id: 'parish_01', type: 'parish' as const, name: 'San Isidro Labrador Parish', class: 'Class A' };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const id = entityId || userEntityInfo.id;
        const type = entityType || userEntityInfo.type;
        
        const [fetchedRecords, score, diag] = await Promise.all([
          dataService.getRecords(id, type, entityClass as any),
          dataService.calculateHealthScore(id, type, entityClass as any),
          dataService.getDiagnostic(id, 'Jan') // Default to current month
        ]);
        setRecords(fetchedRecords);
        setHealthScore(score);
        setDiagnostics([diag]); // Wrap in array as expected by component
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [entityId, entityType, entityClass, userEntityInfo]);

  const kpis = useMemo(() => {
    if (!records.length) return null;
    const totalCollections = records.reduce((sum, r) => sum + r.collections, 0);
    const totalExpenses = records.reduce((sum, r) => sum + r.disbursements, 0);
    const netGrowth = ((totalCollections - totalExpenses) / totalCollections) * 100;
    
    return {
      totalCollections,
      totalExpenses,
      netGrowth,
      efficiency: (totalCollections / (totalExpenses || 1)) * 100
    };
  }, [records]);

  return {
    records,
    healthScore,
    diagnostics,
    kpis,
    isLoading,
    userEntityInfo
  };
}
