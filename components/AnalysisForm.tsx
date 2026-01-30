
import React, { useState } from 'react';
import { AnalysisParams, Frequency, DividendMode, DataProvider, Language } from '../types';

interface AnalysisFormProps {
  onAnalyze: (params: AnalysisParams) => void;
  onReset: () => void;
  isLoading: boolean;
  lang: Language;
}

const AnalysisForm: React.FC<AnalysisFormProps> = ({ onAnalyze, onReset, isLoading, lang }) => {
  const [ticker, setTicker] = useState('AAPL');
  const [mPriceActual, setMPriceActual] = useState('240.50');
  const [mGoldPrice, setMGoldPrice] = useState('2650.00');
  const [horizon, setHorizon] = useState(15);
  const [frequency, setFrequency] = useState<Frequency>(Frequency.DAILY);
  const [benchmark, setBenchmark] = useState('SPY');
  const [mBenchmarkPrice, setMBenchmarkPrice] = useState('595.00');
  const [dividendMode, setDividendMode] = useState<DividendMode>(DividendMode.PRICE_ONLY);
  
  const [mYield, setMYield] = useState('0.5');
  const [mDGR, setMDGR] = useState('10');
  const [mPayoutEPS, setMPayoutEPS] = useState('25');
  const [mPayoutFCF, setMPayoutFCF] = useState('20');
  const [mDebt, setMDebt] = useState('1.2');
  const [mCov, setMCov] = useState('15');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const isEn = lang === Language.EN;

  const parseNumber = (text: string, pattern: RegExp): string => {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Limpieza profunda: quita $, %, comas de miles, x, etc.
      return match[1].replace(/[$,%x]/g, '').replace(/,/g, '').trim();
    }
    return '';
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    // 1. Tickers
    const tickerMatch = bulkText.match(/Ticker:\s*([A-Za-z.]+)/i);
    const benchTickerMatch = bulkText.match(/Benchmark Ticker:\s*([A-Za-z.]+)/i);

    // 2. Precios Manuales
    const priceVal = parseNumber(bulkText, /Price:\s*([$\d,.]+)/i);
    
    // Gold Price Detection
    const goldVal = 
      parseNumber(bulkText, /Gold price today:\s*([$\d,.]+)/i) || 
      parseNumber(bulkText, /Gold Price:\s*([$\d,.]+)/i) ||
      parseNumber(bulkText, /Gold:\s*([$\d,.]+)/i);
    
    // Benchmark/SPY Price Detection - PRIORIDAD a "Bench Price (SPY)" solicitado por el usuario
    const benchPriceVal = 
      parseNumber(bulkText, /Bench Price \(SPY\):\s*([$\d,.]+)/i) || 
      parseNumber(bulkText, /Bench Price:\s*([$\d,.]+)/i) ||
      parseNumber(bulkText, /Benchmark Price:\s*([$\d,.]+)/i) || 
      parseNumber(bulkText, /SPY Price:\s*([$\d,.]+)/i) ||
      parseNumber(bulkText, /SPY:\s*([$\d,.]+)/i) ||
      parseNumber(bulkText, /Benchmark:\s*([$\d,.]+)/i);

    // 3. Fundamentales
    const yieldVal = parseNumber(bulkText, /Dividend Yield\s*\(%\):\s*([\d,.]+%?)/i);
    const dgrVal = parseNumber(bulkText, /Dividend Growth Rate 5Y\s*\(%\):\s*([\d,.]+%?)/i);
    const payoutEPSVal = parseNumber(bulkText, /Payout Ratio EPS\s*\(%\):\s*([\d,.]+%?)/i);
    const payoutFCFVal = parseNumber(bulkText, /Payout Ratio FCF\s*\(%\):\s*([\d,.]+%?)/i);
    const debtVal = parseNumber(bulkText, /Debt\s*\/\s*EBITDA\s*\(x\):\s*([\d,.]+x?)/i);
    const covVal = parseNumber(bulkText, /Interest Coverage\s*\(x\):\s*([\d,.]+x?)/i);

    // Update States
    if (tickerMatch) setTicker(tickerMatch[1].toUpperCase());
    if (benchTickerMatch) setBenchmark(benchTickerMatch[1].toUpperCase());
    
    if (priceVal) setMPriceActual(priceVal);
    if (goldVal) setMGoldPrice(goldVal);
    if (benchPriceVal) setMBenchmarkPrice(benchPriceVal);
    
    if (yieldVal) setMYield(yieldVal);
    if (dgrVal) setMDGR(dgrVal);
    if (payoutEPSVal) setMPayoutEPS(payoutEPSVal);
    if (payoutFCFVal) setMPayoutFCF(payoutFCFVal);
    if (debtVal) setMDebt(debtVal);
    if (covVal) setMCov(covVal);

    setIsModalOpen(false);
    setBulkText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    onAnalyze({ 
      ticker: ticker.trim().toUpperCase(), 
      manualPrice: parseFloat(mPriceActual),
      manualGoldPrice: parseFloat(mGoldPrice),
      manualBenchmarkPrice: parseFloat(mBenchmarkPrice),
      horizon, 
      frequency, 
      benchmark: benchmark.trim().toUpperCase(), 
      dividendMode, 
      provider: DataProvider.STOOQ, 
      lang,
      manualYield: parseFloat(mYield),
      manualDGR: parseFloat(mDGR) / 100,
      manualPayoutEPS: parseFloat(mPayoutEPS),
      manualPayoutFCF: parseFloat(mPayoutFCF),
      manualDebtEbitda: parseFloat(mDebt),
      manualInterestCoverage: parseFloat(mCov)
    });
  };

  const handleClear = () => {
    setTicker('');
    setMPriceActual('');
    setMGoldPrice('');
    setMBenchmarkPrice('');
    setHorizon(15);
    setFrequency(Frequency.DAILY);
    setBenchmark('SPY');
    setDividendMode(DividendMode.PRICE_ONLY);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* Row Principal: Precios y Horizonte */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ticker</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 uppercase"
              placeholder="AAPL"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{isEn ? 'Current Price' : 'Precio Actual'}</label>
            <input
              type="number"
              step="0.01"
              value={mPriceActual}
              onChange={(e) => setMPriceActual(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 font-mono"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{isEn ? 'Gold Price' : 'Precio Oro'}</label>
            <input
              type="number"
              step="0.01"
              value={mGoldPrice}
              onChange={(e) => setMGoldPrice(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 font-mono"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{isEn ? 'Horizon' : 'Horizonte'}</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
            >
              <option value={5}>5 {isEn ? 'Years' : 'Años'}</option>
              <option value={10}>10 {isEn ? 'Years' : 'Años'}</option>
              <option value={15}>15 {isEn ? 'Years' : 'Años'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{isEn ? 'Frequency' : 'Frecuencia'}</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
            >
              <option value={Frequency.DAILY}>{isEn ? 'Daily' : 'Diario'}</option>
              <option value={Frequency.WEEKLY}>{isEn ? 'Weekly' : 'Semanal'}</option>
              <option value={Frequency.MONTHLY}>{isEn ? 'Monthly' : 'Mensual'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Benchmark</label>
            <input
              type="text"
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900 uppercase"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{isEn ? 'Benchmark Price' : 'Benchmark Price'}</label>
            <input
              type="number"
              step="0.01"
              value={mBenchmarkPrice}
              onChange={(e) => setMBenchmarkPrice(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 font-mono"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{isEn ? 'Dividends' : 'Dividendos'}</label>
            <select
              value={dividendMode}
              onChange={(e) => setDividendMode(e.target.value as DividendMode)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
            >
              <option value={DividendMode.PRICE_ONLY}>{isEn ? 'Price Only' : 'Solo Precio'}</option>
              <option value={DividendMode.TOTAL_RETURN_APPROX}>{isEn ? 'Total Return (Approx)' : 'Total Return (Aprox)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Row: Fundamentales */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            {isEn ? 'Manual Fundamental Entry' : 'Entrada Manual de Fundamentales'}
          </h3>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            {isEn ? 'Paste Data Block' : 'Pegar Bloque de Datos'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase">Yield (%)</label>
            <input 
              type="number" 
              step="0.01" 
              value={mYield} 
              onChange={(e) => setMYield(e.target.value)} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 font-mono text-sm" 
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase">DGR 5Y (%)</label>
            <input 
              type="number" 
              step="0.1" 
              value={mDGR} 
              onChange={(e) => setMDGR(e.target.value)} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 font-mono text-sm" 
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase">Payout EPS (%)</label>
            <input 
              type="number" 
              step="1" 
              value={mPayoutEPS} 
              onChange={(e) => setMPayoutEPS(e.target.value)} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 font-mono text-sm" 
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase">Payout FCF (%)</label>
            <input 
              type="number" 
              step="1" 
              value={mPayoutFCF} 
              onChange={(e) => setMPayoutFCF(e.target.value)} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 font-mono text-sm" 
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase">Debt/EBITDA</label>
            <input 
              type="number" 
              step="0.1" 
              value={mDebt} 
              onChange={(e) => setMDebt(e.target.value)} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 font-mono text-sm" 
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase">Int. Coverage</label>
            <input 
              type="number" 
              step="0.1" 
              value={mCov} 
              onChange={(e) => setMCov(e.target.value)} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 font-mono text-sm" 
            />
          </div>
        </div>
      </div>

      {/* Footer del Form: Botones */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          className="bg-white text-gray-400 border border-gray-200 font-bold py-2.5 px-4 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline uppercase tracking-widest text-[10px] font-black">{isEn ? 'Start Over' : 'Reiniciar'}</span>
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white font-black py-2.5 px-10 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition-all shadow-lg text-xs uppercase tracking-[0.2em] active:scale-95"
        >
          {isLoading ? (isEn ? 'Processing...' : 'Procesando...') : (isEn ? 'Analyze' : 'Analizar')}
        </button>
      </div>

      {/* Modal: Bulk Import */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                {isEn ? 'Bulk Data Import' : 'Importación Masiva de Datos'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 leading-relaxed">
              {isEn 
                ? 'Paste the technical block to populate all fields instantly.' 
                : 'Pega el bloque técnico para completar todos los campos al instante.'}
            </p>

            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Ticker: MO\nPrice: $59.76\nBench Price (SPY): $595.00\nGold Price: $2650.00\n...`}
              className="w-full h-48 bg-gray-50 border border-gray-200 rounded-2xl p-4 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-gray-300"
            />

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                {isEn ? 'Apply Data' : 'Aplicar Datos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default AnalysisForm;
