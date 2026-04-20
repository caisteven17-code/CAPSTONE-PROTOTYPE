'use client';

import React, { useState, useMemo } from 'react';
import { ParishClassificationCard, ClassificationData } from '../ui/ParishClassificationCard';
import { FiestaManagementModal } from '../projects/FiestaManagementModal';
import { motion } from 'motion/react';

interface EntityClassificationPanelProps {
  entityName: string;
  entityType: 'parish' | 'seminary' | 'school';
  classification: ClassificationData;
  onClassificationUpdate?: (updates: Partial<ClassificationData>) => void;
}

/**
 * Entity-level classification and fiesta management panel
 * Shown to priests/schools/seminaries for their own entity
 */
export function EntityClassificationPanel({
  entityName,
  entityType,
  classification,
  onClassificationUpdate,
}: EntityClassificationPanelProps) {
  const [showFiestaModal, setShowFiestaModal] = useState(false);
  const [fiestas, setFiestas] = useState<any[]>([]);

  const typeLabel = useMemo(() => {
    if (entityType === 'parish') return 'Parish';
    if (entityType === 'seminary') return 'Seminary';
    return 'School';
  }, [entityType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Entity Information</h2>
        <p className="text-gray-600">
          {entityName} • {typeLabel}
        </p>
      </motion.div>

      {/* Classification Card */}
      <ParishClassificationCard
        data={classification}
        entityName={entityName}
        onReclassifyClick={() => {
          // This would trigger a workflow to request diocese review
          console.log('Request reclassification review');
        }}
      />

      {/* Fiesta Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Manage Fiestas & Patron Saints</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure your patron saints and fiesta dates to help the diocese understand collection patterns and seasonal variations.
            </p>
          </div>
          <button
            onClick={() => setShowFiestaModal(true)}
            className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg transition-colors"
          >
            Manage Fiestas
          </button>
        </div>

        {/* Fiestas Summary */}
        <div className="space-y-3">
          {fiestas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No fiestas configured yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Manage Fiestas" to add your first fiesta date</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fiestas.map((fiesta: any) => (
                <div key={fiesta.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-bold text-gray-900">{fiesta.primaryPatron}</p>
                    {fiesta.secondaryPatron && (
                      <p className="text-xs text-gray-500">& {fiesta.secondaryPatron}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">{new Date(fiesta.date).toLocaleDateString()}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      fiesta.expectedImpact === 'high' ? 'bg-red-100 text-red-700' :
                      fiesta.expectedImpact === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {fiesta.expectedImpact.charAt(0).toUpperCase() + fiesta.expectedImpact.slice(1)} Impact
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <p className="text-sm text-blue-900">
          <strong>📌 Tip:</strong> Configuring your fiestas and patron saints helps the diocese understand your collection patterns and provides better financial predictions. Your classification status is determined by your annual collections and diocesan policies.
        </p>
      </motion.div>

      {/* Fiesta Management Modal */}
      {showFiestaModal && (
        <FiestaManagementModal
          isOpen={showFiestaModal}
          fiestas={fiestas}
          onSave={(updatedFiestas) => {
            setFiestas(updatedFiestas);
            setShowFiestaModal(false);
          }}
          onClose={() => setShowFiestaModal(false)}
          entityName={entityName}
        />
      )}
    </div>
  );
}
