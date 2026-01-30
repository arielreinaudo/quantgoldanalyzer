
import React from 'react';
import { RatioResult, Language } from '../types';

interface ExpandedReportProps {
  result: RatioResult;
  lang: Language;
}

const ExpandedReport: React.FC<ExpandedReportProps> = ({ result, lang }) => {
  const { metrics } = result;
  const { scores } = metrics;
  const core = scores.core;
  const mos = scores.mos;
  const gold = scores.goldPurchase;
  const isEn = lang === Language.EN;

  // --- LÓGICA DE INTERPRETACIÓN ---
  const getCoreInterpretation = (score: number) => {
    if (isEn) {
      if (score >= 4.5) return `The Core Score of ${score.toFixed(1)} indicates a world-class asset with impenetrable fundamentals.`;
      if (score >= 4.0) return `A Core Score of ${score.toFixed(1)} reflects a solid quality structure, suitable for institutional-grade long-term compounding.`;
      if (score >= 3.0) return `With a score of ${score.toFixed(1)}, the asset shows healthy characteristics but lacks total dominance.`;
      return `Critical Score (${score.toFixed(1)}). The underlying business metrics do not support a safe dividend strategy.`;
    } else {
      if (score >= 4.5) return `El Core Score de ${score.toFixed(1)} indica un activo de clase mundial con fundamentos impenetrables.`;
      if (score >= 4.0) return `Un Core Score de ${score.toFixed(1)} refleja una estructura de calidad sólida, apta para carteras de capitalización compuesta.`;
      if (score >= 3.0) return `Con una puntuación de ${score.toFixed(1)}, el activo muestra características saludables pero carece de dominancia total.`;
      return `Puntaje Crítico (${score.toFixed(1)}). Las métricas del negocio no respaldan una estrategia de dividendos segura.`;
    }
  };

  const getMosInterpretation = (score: number) => {
    if (isEn) {
      if (score >= 4.0) return `Excellent Margin of Safety (${score.toFixed(1)}). Current price and yield offer a significant discount relative to historical norms.`;
      if (score >= 3.0) return `Fair Value Area (${score.toFixed(1)}). The asset is priced reasonably; returns will depend primarily on earnings growth.`;
      return `High Valuation (${score.toFixed(1)}). The margin of safety is narrow; entry at these levels requires high conviction in exceptional growth.`;
    } else {
      if (score >= 4.0) return `Excelente Margen de Seguridad (${score.toFixed(1)}). El precio y yield actuales ofrecen un descuento significativo respecto a normas históricas.`;
      if (score >= 3.0) return `Área de Valor Razonable (${score.toFixed(1)}). El activo tiene un precio justo; los retornos dependerán del crecimiento de beneficios.`;
      return `Valuación Elevada (${score.toFixed(1)}). El margen de seguridad es estrecho; la entrada requiere alta convicción en un crecimiento excepcional.`;
    }
  };

  const getGoldInterpretation = (score: number) => {
    if (isEn) {
      if (score >= 4.0) return `Strategic Gold Accumulation Zone (${score.toFixed(1)}). The asset is historically cheap when measured in hard currency (ounces).`;
      if (score >= 3.0) return `Neutral Gold Regime (${score.toFixed(1)}). The stock/gold ratio is within its median historical range.`;
      return `Gold Overvaluation Warning (${score.toFixed(1)}). The asset is expensive in gold terms; consider rotating or limiting new capital.`;
    } else {
      if (score >= 4.0) return `Zona Estratégica de Acumulación en Oro (${score.toFixed(1)}). El activo está históricamente barato medido en moneda dura (onzas).`;
      if (score >= 3.0) return `Régimen de Oro Neutral (${score.toFixed(1)}). El ratio acción/oro se encuentra dentro de su rango medio histórico.`;
      return `Advertencia de Sobrevaluación en Oro (${score.toFixed(1)}). El activo está caro en términos de oro; considerar rotar o limitar nuevo capital.`;
    }
  };

  const getConclusionText = (score: number) => {
    if (isEn) {
      if (score >= 4.0) return "STRATEGIC APPROVAL";
      if (score >= 3.0) return "ACTIVE MONITORING";
      return "SELECTIVE AVOIDANCE";
    } else {
      if (score >= 4.0) return "APROBACIÓN ESTRATÉGICA";
      if (score >= 3.0) return "MONITOREO ACTIVO";
      return "EVITACIÓN SELECTIVA";
    }
  };

  return (
    <div className="mt-8 p-6 sm:p-10 bg-slate-50 rounded-[2rem] sm:rounded-[3rem] border-2 border-slate-200">
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-8 sm:mb-10 uppercase tracking-tighter border-b-4 border-slate-900 pb-4">
        {isEn ? 'Integrated Quant Analysis Report' : 'Reporte Integrado de Análisis Quant'}
      </h2>

      {/* SECCIÓN 1: CORE SCORE */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">1. Core Quality Score ({core.total.toFixed(1)}/5)</h3>
          <span className="text-xs font-bold text-slate-800 uppercase">{getConclusionText(core.total)}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <p className="text-lg font-bold text-slate-800 leading-tight">{getCoreInterpretation(core.total)}</p>
            <p className="text-sm text-slate-600 leading-relaxed italic">
              {isEn ? 
                `The business moat is rated at ${core.moat.toFixed(1)}, supported by a resilience score of ${core.resilience.toFixed(1)}. This combination determines the long-term holding safety.` :
                `El moat del negocio tiene una calificación de ${core.moat.toFixed(1)}, respaldado por un puntaje de resiliencia de ${core.resilience.toFixed(1)}. Esta combinación determina la seguridad de tenencia a largo plazo.`
              }
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase mb-2">Primary Driver:</span>
            <span className="text-xs font-bold text-slate-800">
              {core.engine > 3.5 
                ? (isEn ? "Aggressive Dividend Growth" : "Crecimiento de Dividendos Agresivo")
                : (isEn ? "Conservative Capital Preservation" : "Preservación de Capital Conservadora")}
            </span>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: TIMING (MOS) */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">2. Timing & Valuation Score ({mos.total.toFixed(1)}/5)</h3>
          <span className="text-xs font-bold text-slate-800 uppercase">{getConclusionText(mos.total)}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <p className="text-lg font-bold text-slate-800 leading-tight">{getMosInterpretation(mos.total)}</p>
            <p className="text-sm text-slate-600 leading-relaxed italic">
              {isEn ? 
                `Valuation analysis focuses on the yield-to-price relationship. A history score of ${mos.yieldHistory.toFixed(1)} suggests current income is ${mos.yieldHistory > 3.5 ? 'above' : 'below'} the asset's historical mean.` :
                `El análisis de valuación se enfoca en la relación yield-precio. Un puntaje histórico de ${mos.yieldHistory.toFixed(1)} sugiere que el ingreso actual está ${mos.yieldHistory > 3.5 ? 'por encima' : 'por debajo'} de la media histórica del activo.`
              }
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase mb-2">Valuation Regime:</span>
            <span className="text-xs font-bold text-slate-800">
              {mos.total > 3.5 
                ? (isEn ? "Expansion of Margin of Safety" : "Expansión del Margen de Seguridad")
                : (isEn ? "Contraction of Margin of Safety" : "Contracción del Margen de Seguridad")}
            </span>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: GOLD PURCHASE */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">3. Gold Purchase Opportunity ({gold.total.toFixed(1)}/5)</h3>
          <span className="text-xs font-bold text-slate-800 uppercase">{getConclusionText(gold.total)}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <p className="text-lg font-bold text-slate-800 leading-tight">{getGoldInterpretation(gold.total)}</p>
            <p className="text-sm text-slate-600 leading-relaxed italic">
              {isEn ? 
                `Price in ounces (Score: ${gold.price.toFixed(1)}) and the Stock/Gold regime (${gold.regime.toFixed(1)}) confirm ${gold.total > 3.5 ? 'a strong case for hard-asset substitution' : 'the need for caution in currency protection'}.` :
                `El precio en onzas (Score: ${gold.price.toFixed(1)}) y el régimen Stock/Gold (${gold.regime.toFixed(1)}) confirman ${gold.total > 3.5 ? 'un argumento sólido para la sustitución de activos duros' : 'la necesidad de cautela en la protección de divisa'}.`
              }
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase mb-2">Relative Hard Power:</span>
            <span className="text-xs font-bold text-slate-800">
              {gold.relativeStrength > 3.5 
                ? (isEn ? "Outperforming Hard Currency" : "Superando a la Moneda Dura")
                : (isEn ? "Underperforming vs Gold" : "Bajo rendimiento vs Oro")}
            </span>
          </div>
        </div>
      </section>

      {/* RESUMEN FINAL */}
      <div className="mt-12 p-8 bg-slate-900 text-white rounded-[2rem] shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Consensus Strategy</h4>
            <p className="text-2xl font-black tracking-tight uppercase">
              {isEn ? 
                (metrics.mosZone === 'A' ? "Priority Accumulation Plan" : "Strategic Holding & Monitoring") :
                (metrics.mosZone === 'A' ? "Plan de Acumulación Prioritaria" : "Tenencia Estratégica y Monitoreo")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center">
              <span className="text-xl font-black">{((core.total + mos.total + gold.total) / 3).toFixed(1)}</span>
            </div>
            <div className="h-10 w-[2px] bg-slate-700"></div>
            <p className="text-[10px] font-bold text-slate-400 max-w-[150px] uppercase leading-tight text-left">
              {isEn ? "Final Quant Weighted Score (Quality + Value + Gold)" : "Score Final Ponderado (Calidad + Valor + Oro)"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandedReport;
