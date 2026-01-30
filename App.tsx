
import React, { useState, useRef } from 'react';
import AnalysisForm from './components/AnalysisForm';
import Chart from './components/Chart';
import ReportView from './components/ReportView';
import { AnalysisParams, RatioResult, Language } from './types';
import { analyzeTicker } from './services/dataService';

const App: React.FC = () => {
  const [result, setResult] = useState<RatioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'charts' | 'report'>('charts');
  const [lang, setLang] = useState<Language>(Language.EN);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [analysisKey, setAnalysisKey] = useState(0);
  
  const reportRef = useRef<{ handleDownloadPDF: () => Promise<void> }>(null);

  const isEn = lang === Language.EN;

  const handleReset = () => {
    setResult(null);
    setError(null);
    setLoading(false);
    setAnalysisKey(prev => prev + 1);
  };

  const handleAnalyze = async (params: AnalysisParams) => {
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      // Latencia mínima artificial para feedback visual (100ms)
      await new Promise(resolve => setTimeout(resolve, 100));
      const data = await analyzeTicker({ ...params, lang });
      setResult(data);
      setAnalysisKey(prev => prev + 1);
      setError(null);
    } catch (err: any) {
      setError(err.message || (isEn ? 'Analysis failed.' : 'Error en el análisis.'));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const triggerDownloadPDF = async () => {
    if (reportRef.current && !isGeneratingPDF) {
      setIsGeneratingPDF(true);
      try {
        await reportRef.current.handleDownloadPDF();
      } finally {
        setIsGeneratingPDF(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 w-full">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-black">Q</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900 hidden sm:block">QuantGold</h1>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button 
                onClick={() => setActiveTab('charts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'charts' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-800'}`}
              >
                {isEn ? 'DASHBOARD' : 'PANEL'}
              </button>
              <button 
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'report' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-800'}`}
              >
                {isEn ? 'REPORT' : 'REPORTE'}
              </button>
            </nav>

            {activeTab === 'report' && result && (
              <button
                onClick={triggerDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:bg-gray-400"
              >
                {isGeneratingPDF ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                <span className="hidden xs:inline">
                  {isGeneratingPDF ? (isEn ? 'BUSY...' : 'ESPERE...') : (isEn ? 'PDF' : 'PDF')}
                </span>
              </button>
            )}

            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setLang(Language.EN)}
                className={`px-2 py-1 rounded text-[10px] font-black tracking-widest transition-all ${isEn ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang(Language.ES)}
                className={`px-2 py-1 rounded text-[10px] font-black tracking-widest transition-all ${!isEn ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8 w-full overflow-hidden">
        <AnalysisForm onAnalyze={handleAnalyze} onReset={handleReset} isLoading={loading} lang={lang} />

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
               </svg>
               <span>{error}</span>
            </div>
            <button onClick={handleReset} className="text-xs underline uppercase tracking-widest font-black">OK</button>
          </div>
        )}

        {loading && (
          <div className="mt-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-bold uppercase tracking-tighter animate-pulse">
              {isEn ? 'Running Quant Logic... Fetching Real Data' : 'Ejecutando Lógica Quant... Obteniendo Datos Reales'}
            </p>
          </div>
        )}

        {result && !loading && (
          <div key={analysisKey} className="mt-8 space-y-8 w-full">
            {activeTab === 'charts' ? (
              <div className="w-full space-y-8">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                    {result.ticker}
                  </h2>
                  <p className="text-lg text-gray-500 font-medium italic">
                    {result.assetName}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">{isEn ? 'Current Ratio' : 'Ratio Actual'}</p>
                    <p className="text-2xl font-mono text-gray-900 font-black">{result.metrics.currentRatio.toFixed(4)} <span className="text-sm font-normal text-gray-400">oz/sh</span></p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">{isEn ? 'Percentile' : 'Percentil'} ({result.horizonYears}y)</p>
                    <p className="text-2xl font-mono text-gray-900 font-black">{result.metrics.percentile.toFixed(1)}%</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">SMA 200d</p>
                    <p className={`text-2xl font-black ${result.metrics.signals.aboveSMA200d ? 'text-green-600' : 'text-red-600'}`}>
                      {result.metrics.signals.aboveSMA200d ? (isEn ? 'UP' : 'ALZA') : (isEn ? 'DOWN' : 'BAJA')}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">SMA 200w</p>
                    <p className={`text-2xl font-black ${result.metrics.signals.aboveSMA200w ? 'text-green-600' : 'text-red-600'}`}>
                      {result.metrics.signals.aboveSMA200w ? (isEn ? 'UP' : 'ALZA') : (isEn ? 'DOWN' : 'BAJA')}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">{isEn ? 'Annual Vol' : 'Vol. Anual'}</p>
                    <p className="text-2xl font-mono text-gray-900 font-black">{(result.metrics.volatilityAnnual * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="flex flex-col gap-8 w-full">
                  <Chart 
                    title={`${result.ticker} / GOLD`} 
                    data={result.data.ratio} 
                    overlayData={[
                      { data: result.data.ratioSMA200d, color: '#94a3b8', name: 'SMA 200d' },
                      { data: result.data.ratioSMA200w, color: '#f59e0b', name: 'SMA 200w' }
                    ]}
                  />
                  <Chart 
                    title={`${result.benchmarkTicker || 'SPY'} / GOLD`} 
                    data={result.data.benchmarkRatio} 
                  />
                </div>
              </div>
            ) : (
              <ReportView ref={reportRef} result={result} lang={lang} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
