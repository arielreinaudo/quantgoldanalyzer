
import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { RatioResult, Language } from '../types';
import ExpandedReport from './ExpandedReport';
import Chart from './Chart';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ReportViewProps {
  result: RatioResult;
  lang: Language;
}

const ReportView = forwardRef<{ handleDownloadPDF: () => Promise<void> }, ReportViewProps>(({ result, lang }, ref) => {
  const { ticker, metrics } = result;
  const { scores, chowder, dividendSafety, expectedReturn } = metrics;
  const { goldPurchase } = scores;
  const [showExpanded, setShowExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isEn = lang === Language.EN;

  const getActionBadge = () => {
    const coreTotal = scores.core.total;
    const gpsTotal = goldPurchase.total;
    if (coreTotal >= 4.0) {
      if (gpsTotal >= 4.0) return isEn ? 'STRONG ACCUMULATE' : 'ACUMULACIÓN FUERTE';
      if (gpsTotal >= 3.0) return isEn ? 'STAGGERED ACCUMULATE' : 'ACUMULACIÓN (ESCALONADA)';
    }
    return isEn ? 'WATCH / HOLD' : 'VIGILAR / MANTENER';
  };

  const actionBadge = getActionBadge();

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);

  const getScoreColor = (score: number) => {
    if (score >= 4.0) return 'text-green-600';
    if (score >= 3.0) return 'text-blue-600';
    if (score >= 2.0) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBadgeColor = (badge: string) => {
    const b = badge.toUpperCase();
    if (b.includes('STRONG') || b.includes('FUERTE')) return 'bg-green-700 text-white';
    if (b.includes('ACCUMULATE') || b.includes('ACUMULACIÓN')) return 'bg-green-500 text-white';
    if (b.includes('WATCH') || b.includes('VIGILAR')) return 'bg-blue-500 text-white';
    if (b.includes('AVOID') || b.includes('EVITAR')) return 'bg-amber-500 text-white';
    return 'bg-red-600 text-white';
  };

  const markerPosition = Math.min(Math.max((chowder.chowderNumber / 20) * 100, 0), 100);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    const originalShowExpanded = showExpanded;
    setShowExpanded(true); 
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        compress: true 
      });

      const pageWidth = 215.9; 
      const pageHeight = 279.4; 
      const xMargin = 10;
      const yMargin = 7; 
      const targetWidth = pageWidth - (xMargin * 2);
      const availableHeight = pageHeight - (yMargin * 2);
      
      const refs = [page1Ref, page2Ref, page3Ref];
      
      for (let i = 0; i < refs.length; i++) {
        const refElement = refs[i];
        if (!refElement?.current) continue;
        
        const canvas = await html2canvas(refElement.current, { 
          scale: 1.6, 
          useCORS: true, 
          logging: false, 
          backgroundColor: '#ffffff' 
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.75);
        
        let imgHeight = (canvas.height * targetWidth) / canvas.width;
        let finalWidth = targetWidth;
        let finalHeight = imgHeight;

        if (imgHeight > availableHeight) {
          const ratio = availableHeight / imgHeight;
          finalHeight = availableHeight;
          finalWidth = targetWidth * ratio;
        }

        const xPos = xMargin + (targetWidth - finalWidth) / 2;
        const yPos = finalHeight < availableHeight ? yMargin + (availableHeight - finalHeight) / 2 : yMargin;
        
        if (i > 0) pdf.addPage();
        
        pdf.addImage(imgData, 'JPEG', xPos, yPos, finalWidth, finalHeight, undefined, 'FAST');
      }
      
      pdf.save(`${ticker}_QuantGold.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsGenerating(false);
      setShowExpanded(originalShowExpanded);
    }
  };

  useImperativeHandle(ref, () => ({
    handleDownloadPDF
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 px-4">
      <div className="flex flex-col space-y-12">
        {/* HOJA 1 */}
        <div ref={page1Ref} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 min-h-fit overflow-hidden">
          <div className={`${isGenerating ? 'flex' : 'hidden'} justify-between items-center mb-10 pb-6 border-b border-gray-100`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-lg">Q</span>
              </div>
              <span className="text-2xl font-black tracking-tighter text-gray-900">QuantGold</span>
            </div>
            <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] text-right leading-tight">
              BY ARIEL REINAUDO<br/>
              <span className="text-blue-500">@ARIELREINAUDO</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b-2 border-gray-900">
            <div>
              <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">{ticker}</h1>
              <p className="text-xl text-gray-400 font-bold uppercase tracking-widest mt-1">{result.assetName}</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col items-end">
              <div className={`px-10 py-4 rounded-2xl font-black text-2xl shadow-xl border-b-4 border-black/20 ${getBadgeColor(actionBadge)}`}>
                {actionBadge}
              </div>
              <p className="text-[10px] mt-2 font-bold text-gray-400 uppercase tracking-tighter">Gold-Risk Weighted Consensus</p>
            </div>
          </div>

          <section className="mb-10 space-y-4">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
              <span className="w-2 h-6 bg-yellow-600"></span> 0. {isEn ? 'Visual Ratio Analysis' : 'Análisis Visual de Ratios'}
            </h2>
            <div className="max-w-2xl mx-auto">
              <Chart 
                title={`${result.ticker} / GOLD`} 
                data={result.data.ratio} 
                height={200} 
                overlayData={[
                  { data: result.data.ratioSMA200d, color: '#94a3b8', name: 'SMA 200d' },
                  { data: result.data.ratioSMA200w, color: '#f59e0b', name: 'SMA 200w' }
                ]}
              />
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tighter flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600"></span> 1. {isEn ? 'Execution Plan (MOS Ladder)' : 'Plan de Ejecución (MOS Ladder)'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border-2 ${metrics.mosZone === 'A' ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-[10px] font-black text-green-700 uppercase mb-2">{isEn ? 'Zone A (High MOS)' : 'Zona A (MOS Alto)'}</p>
                <p className="text-xs font-bold text-gray-700 leading-tight">{isEn ? "60-100% Size. Yield > p70 hist. + Gold Ratio < p25." : "60-100% Tamaño. Yield > p70 hist. + Ratio Oro < p25."}</p>
              </div>
              <div className={`p-5 rounded-2xl border-2 ${metrics.mosZone === 'B' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-[10px] font-black text-blue-700 uppercase mb-2">{isEn ? 'Zone B (Mid MOS)' : 'Zona B (MOS Medio)'}</p>
                <p className="text-xs font-bold text-gray-700 leading-tight">{isEn ? "25-60% Size. SMA 200d confirmed. Gold Ratio < p50." : "25-60% Tamaño. SMA 200d confirmada. Ratio Oro < p50."}</p>
              </div>
              <div className={`p-5 rounded-2xl border-2 ${metrics.mosZone === 'C' ? 'border-amber-500 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-[10px] font-black text-amber-700 uppercase mb-2">{isEn ? 'Zone C (Low MOS)' : 'Zona C (MOS Bajo)'}</p>
                <p className="text-xs font-bold text-gray-700 leading-tight">{isEn ? "0-25% Size. Reinvestment only. Gold Ratio > p75." : "0-25% Tamaño. Solo reinversión. Ratio Oro > p75."}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Core Score</h3>
                <span className={`text-2xl font-black ${getScoreColor(scores.core.total)}`}>{scores.core.total.toFixed(1)}</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: isEn ? 'Moat / Competency' : 'Moat / Competencia', val: scores.core.moat },
                  { label: isEn ? 'Dividend Engine' : 'Motor de Dividendos', val: scores.core.engine },
                  { label: isEn ? 'Cash Resilience' : 'Resiliencia de Caja', val: scores.core.resilience }
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mb-1">
                      <span>{item.label}</span>
                      <span>{item.val.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-800" style={{ width: `${(item.val / 5) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Timing (MOS)</h3>
                <span className={`text-2xl font-black ${getScoreColor(scores.mos.total)}`}>{scores.mos.total.toFixed(1)}</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: isEn ? 'Trad. Valuation' : 'Valuación Tradicional', val: scores.mos.valuation },
                  { label: isEn ? 'Historical Yield' : 'Yield Histórico', val: scores.mos.yieldHistory },
                  { label: isEn ? 'Ratio vs Gold (Pctl)' : 'Ratio vs Oro (Percentil)', val: scores.mos.goldPercentile }
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mb-1">
                      <span>{item.label}</span>
                      <span>{item.val.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${(item.val / 5) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-100 rounded-3xl border border-slate-300 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Gold Purchase</h3>
                <span className={`text-2xl font-black ${getScoreColor(goldPurchase.total)}`}>{goldPurchase.total.toFixed(1)}</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: isEn ? 'Price in Ounces' : 'Precio en Onzas', val: goldPurchase.price },
                  { label: isEn ? 'Ratio Trend' : 'Tendencia del Ratio', val: goldPurchase.trend },
                  { label: isEn ? 'Regime (SPY/GOLD)' : 'Régimen (SPY/ORO)', val: goldPurchase.regime },
                  { label: isEn ? 'Relative Strength' : 'Fortaleza Relativa', val: goldPurchase.relativeStrength }
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 mb-0.5">
                      <span>{item.label}</span>
                      <span>{item.val.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-600" style={{ width: `${(item.val / 5) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* HOJA 2 */}
        <div ref={page2Ref} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-12 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-8">Chowder Gate</h2>
              <div className="flex justify-between items-center mb-6">
                <div className="text-4xl font-black text-gray-900">{chowder.chowderNumber.toFixed(2)}</div>
                <div className="text-2xl font-black text-gray-300">{isEn ? 'Target: 12.00' : 'Meta: 12.00'}</div>
              </div>
              <p className="text-sm text-gray-500 italic mb-8">"{isEn ? (chowder.chowderNumber >= 12 ? "Passes security threshold." : "Does not reach 12% threshold.") : (chowder.chowderNumber >= 12 ? "Cumple umbral de seguridad." : "No alcanza umbral del 12%.")}"</p>
              <div className="relative h-4 w-full rounded-full mb-4" style={{ background: 'linear-gradient(to right, #ef4444 0%, #ef4444 40%, #f59e0b 40%, #f59e0b 60%, #10b981 60%, #10b981 100%)' }}>
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-900 rounded-full shadow-md z-10" style={{ left: `calc(${markerPosition}% - 0.5rem)` }} />
              </div>
              <div className="flex justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {chowder.yield.toFixed(2)}% Yield + {chowder.dgr5y.toFixed(2)}% DGR 5y = {chowder.chowderNumber.toFixed(2)}
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-black text-gray-800 mb-8 uppercase tracking-tight">Dividend Safety Panel</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Payout (EPS)</p>
                  <p className="text-xl font-black text-gray-900">{dividendSafety.payoutEPS}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{isEn ? 'Debt / EBITDA' : 'Deuda / EBITDA'}</p>
                  <p className="text-xl font-black text-gray-900">{dividendSafety.debtEbitda}x</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Payout (FCF)</p>
                  <p className="text-xl font-black text-gray-900">{dividendSafety.payoutFCF}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Int. Coverage</p>
                  <p className="text-xl font-black text-green-600">{dividendSafety.interestCoverage}x</p>
                </div>
              </div>
            </section>
          </div>

          <section className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 text-center">
            <h2 className="text-2xl font-black text-slate-800 mb-10 uppercase tracking-tighter">{isEn ? 'Expected Total Return (15Y Projection)' : 'Retorno Total Esperado (15Y Projection)'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase mb-2">{isEn ? 'Conservative' : 'Conservador'}</p>
                <p className="text-4xl font-black text-slate-800">{expectedReturn.conservative.toFixed(1)}%</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 scale-110">
                <p className="text-xs font-black text-blue-600 uppercase mb-2">{isEn ? 'Base Scenario' : 'Escenario Base'}</p>
                <p className="text-6xl font-black text-slate-900">{expectedReturn.base.toFixed(1)}%</p>
                <p className="text-[10px] mt-2 font-bold text-slate-400 uppercase">Yield + DGR 100%</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase mb-2">{isEn ? 'Optimistic' : 'Optimista'}</p>
                <p className="text-4xl font-black text-slate-800">{expectedReturn.optimistic.toFixed(1)}%</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-50 p-10 rounded-3xl border border-gray-200">
            <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tighter">{isEn ? 'Follow-up Triggers & Operations' : 'Gatillos de Seguimiento y Operativa'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: isEn ? 'Yield Trigger' : 'Gatillo Yield', desc: isEn ? `If Yield exceeds ${chowder.yield.toFixed(1)}% (p70), enable Zone A tranche.` : `Si el Yield supera el ${chowder.yield.toFixed(1)}% (percentil p70), habilitar tramo Zona A.`, status: metrics.mosZone === 'A' },
                { label: isEn ? 'Gold Regime Trigger' : 'Gatillo Régimen Gold', desc: isEn ? 'If GPS > 4.0, prioritize accumulation over benchmark.' : 'Si el GPS > 4.0, priorizar acumulación sobre benchmark.', status: goldPurchase.price >= 4.0 },
                { label: isEn ? 'Coverage Trigger' : 'Gatillo Cobertura', desc: isEn ? 'If Debt/EBITDA > 3.5x, freeze new buys and review thesis.' : 'Si Deuda/EBITDA > 3.5x, congelar nuevas compras y revisar tesis.', status: dividendSafety.debtEbitda < 3.5 },
                { label: isEn ? 'Gold Stay Trigger' : 'Gatillo Oro', desc: isEn ? `Maintain while GPS stays in p10-p50 range.` : `Mantener mientras GPS se mantenga en rango p10-p50.`, status: metrics.percentile < 50 }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${item.status ? 'bg-green-600' : 'bg-gray-200'}`}>
                    {item.status && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-bold text-gray-700 leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* HOJA 3 */}
        <div ref={page3Ref} className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-10 flex flex-col min-h-fit overflow-hidden">
          {showExpanded && <ExpandedReport result={result} lang={lang} />}
          
          <footer className={`border-t border-gray-100 flex flex-col items-center ${isGenerating ? 'mt-6 pt-6 pb-2' : 'mt-12 pt-12 pb-4'}`}>
            <div className={`font-bold italic text-center max-w-4xl ${isGenerating ? 'text-[8px] space-y-3' : 'text-[10px] text-gray-400 space-y-6'}`}>
              <p className={`uppercase tracking-widest text-gray-500 font-black ${isGenerating ? 'text-[9px]' : ''}`}>GOLDPURCHASE FRAMEWORK v1.5</p>
              <p className={`text-gray-500 font-bold leading-relaxed ${isGenerating ? 'px-6' : 'px-10'}`}>
                {isEn ? 
                  "This report evaluates dividend flow quality and asset valuation measured in real purchasing power (gold). The Core Score validates long-term suitability; the Gold Purchase Score guides buying intensity based on current market regime." :
                  "Este reporte evalúa la calidad del flujo por dividendos y la valuación del activo medida en poder adquisitivo real (oro). El Core Score valida la aptitud del activo para el largo plazo; el Gold Purchase Score guía la intensidad de compra según el régimen actual de mercado."}
              </p>
              <div className={`flex flex-col items-center ${isGenerating ? 'gap-0.5' : 'gap-1'}`}>
                <p className={`text-gray-400 font-black not-italic ${isGenerating ? 'text-xs' : 'text-sm'}`}>Ariel Reinaudo</p>
                <p className={`text-blue-500 font-black not-italic ${isGenerating ? 'text-xs' : 'text-sm'}`}>@arielreinaudo</p>
              </div>
              <div className={`leading-relaxed font-normal text-gray-400 opacity-80 text-justify border-t border-gray-50 ${isGenerating ? 'text-[7px] pt-3 px-4' : 'text-[9px] pt-6'}`}>
                {isEn ? "Disclaimer: This report is purely educational. It does not constitute financial, legal, or tax advice." : "Disclaimer: Este informe es exclusivamente educativo. No constituye asesoramiento financiero, legal ni fiscal."}
              </div>
            </div>
          </footer>
        </div>
      </div>

      <div className="flex flex-col items-center pt-8 print:hidden">
        <button 
          onClick={() => setShowExpanded(!showExpanded)}
          className="px-8 py-3 bg-white border-2 border-slate-200 rounded-full text-sm font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-md"
        >
          {showExpanded ? (isEn ? 'Hide Detailed Interpretation' : 'Ocultar Interpretación Detallada') : (isEn ? 'View Detailed Interpretation' : 'Ver Interpretación Detallada (Reporte Expandido)')}
        </button>
      </div>
    </div>
  );
});

export default ReportView;
