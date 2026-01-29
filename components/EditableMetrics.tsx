
import React, { useState } from 'react';
import { RatioResult, Language } from '../types';

interface EditableMetricsProps {
  result: RatioResult;
  onUpdate: (updatedResult: RatioResult) => void;
}

const EditableMetrics: React.FC<EditableMetricsProps> = ({ result, onUpdate }) => {
  const isEn = result.lang === Language.EN;

  // Inicialización directa del estado local desde los props de result.
  // Al cambiar la 'key' en el padre, este componente se destruye y crea con nuevos valores.
  const [localValues, setLocalValues] = useState({
    yield: result.metrics.chowder.yield.toString(),
    dgr5y: result.metrics.chowder.dgr5y.toString(),
    payoutEPS: result.metrics.dividendSafety.payoutEPS.toString(),
    payoutFCF: result.metrics.dividendSafety.payoutFCF.toString(),
    debtEbitda: result.metrics.dividendSafety.debtEbitda.toString(),
    interestCoverage: result.metrics.dividendSafety.interestCoverage.toString(),
  });

  const handleInputChange = (field: keyof typeof localValues, stringValue: string) => {
    setLocalValues(prev => ({ ...prev, [field]: stringValue }));
    const numericValue = parseFloat(stringValue);
    if (!isNaN(numericValue)) {
      updateParentMetrics(field as string, numericValue);
    }
  };

  const updateParentMetrics = (field: string, value: number) => {
    const newResult = JSON.parse(JSON.stringify(result)) as RatioResult;
    
    if (field === 'yield') newResult.metrics.chowder.yield = value;
    if (field === 'dgr5y') newResult.metrics.chowder.dgr5y = value;
    if (field === 'payoutEPS') newResult.metrics.dividendSafety.payoutEPS = value;
    if (field === 'payoutFCF') newResult.metrics.dividendSafety.payoutFCF = value;
    if (field === 'debtEbitda') newResult.metrics.dividendSafety.debtEbitda = value;
    if (field === 'interestCoverage') newResult.metrics.dividendSafety.interestCoverage = value;

    const y = newResult.metrics.chowder.yield;
    const d = newResult.metrics.chowder.dgr5y;
    const pFCF = newResult.metrics.dividendSafety.payoutFCF;
    const debt = newResult.metrics.dividendSafety.debtEbitda;
    const cov = newResult.metrics.dividendSafety.interestCoverage;
    const pctl = newResult.metrics.percentile;

    newResult.metrics.chowder.chowderNumber = y + d;
    newResult.metrics.chowder.passGate = newResult.metrics.chowder.chowderNumber >= 12;

    const engineScore = Math.min(5, d / 2.5); 
    let moatScore = 2.0;
    if (y > 2.5 && d > 8) moatScore = 5.0;
    else if (y > 1.5 && d > 5) moatScore = 4.0;
    else if (y > 0.5 && d > 2) moatScore = 3.0;

    const pScore = pFCF < 50 ? 5 : pFCF < 75 ? 3.5 : 1.5;
    const dScore = debt < 1.5 ? 5 : debt < 3.5 ? 3.5 : 1.5;
    const cScore = cov > 10 ? 5 : cov > 4 ? 3.5 : 1.5;
    const resilienceScore = (pScore * 0.4) + (dScore * 0.3) + (cScore * 0.3);

    newResult.metrics.scores.core.engine = engineScore;
    newResult.metrics.scores.core.moat = moatScore;
    newResult.metrics.scores.core.resilience = resilienceScore;
    newResult.metrics.scores.core.total = (moatScore + engineScore + resilienceScore) / 3;

    const yieldHistScore = Math.min(5, (y / 3) * 4); 
    newResult.metrics.scores.mos.yieldHistory = yieldHistScore;
    const mos = newResult.metrics.scores.mos;
    newResult.metrics.scores.mos.total = (mos.valuation + yieldHistScore + mos.goldPercentile + mos.regime) / 4;

    if (pctl < 25 && resilienceScore > 3.5) newResult.metrics.mosZone = 'A';
    else if (pctl > 75 || resilienceScore < 2.5) newResult.metrics.mosZone = 'C';
    else newResult.metrics.mosZone = 'B';

    newResult.metrics.expectedReturn.conservative = y + (d * 0.6);
    newResult.metrics.expectedReturn.base = y + d;
    newResult.metrics.expectedReturn.optimistic = y + (d * 1.4);

    onUpdate(newResult);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6">
      <style>
        {`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
          {isEn ? 'Data Override & Fundamental Editor' : 'Editor de Datos Fundamentales (Manual Override)'}
        </h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Div. Yield (%)</label>
          <input 
            type="number" 
            step="0.01"
            value={localValues.yield}
            onChange={(e) => handleInputChange('yield', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">DGR 5Y (%)</label>
          <input 
            type="number" 
            step="0.1"
            value={localValues.dgr5y}
            onChange={(e) => handleInputChange('dgr5y', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Payout EPS (%)</label>
          <input 
            type="number" 
            value={localValues.payoutEPS}
            onChange={(e) => handleInputChange('payoutEPS', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Payout FCF (%)</label>
          <input 
            type="number" 
            value={localValues.payoutFCF}
            onChange={(e) => handleInputChange('payoutFCF', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Debt / EBITDA (x)</label>
          <input 
            type="number" 
            step="0.1"
            value={localValues.debtEbitda}
            onChange={(e) => handleInputChange('debtEbitda', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Int. Coverage (x)</label>
          <input 
            type="number" 
            step="0.1"
            value={localValues.interestCoverage}
            onChange={(e) => handleInputChange('interestCoverage', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>
      <p className="mt-4 text-[10px] text-gray-400 italic">
        {isEn 
          ? "* Manual edits will update analysis scores, strategy zones, and tactical plans in real-time." 
          : "* Las ediciones manuales actualizarán los puntajes, zonas de estrategia y planes tácticos en tiempo real."}
      </p>
    </div>
  );
};

export default EditableMetrics;
