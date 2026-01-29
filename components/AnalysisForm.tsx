
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
  const [horizon, setHorizon] = useState(15);
  const [frequency, setFrequency] = useState<Frequency>(Frequency.DAILY);
  const [benchmark, setBenchmark] = useState('SPY');
  const [dividendMode, setDividendMode] = useState<DividendMode>(DividendMode.PRICE_ONLY);
  const [provider, setProvider] = useState<DataProvider>(DataProvider.STOOQ);

  const isEn = lang === Language.EN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    onAnalyze({ ticker: ticker.trim().toUpperCase(), horizon, frequency, benchmark: benchmark.trim().toUpperCase(), dividendMode, provider, lang });
  };

  const handleClear = () => {
    setTicker('');
    setHorizon(15);
    setFrequency(Frequency.DAILY);
    setBenchmark('SPY');
    setDividendMode(DividendMode.PRICE_ONLY);
    setProvider(DataProvider.STOOQ);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ticker</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900"
            placeholder="e.g. EPD"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{isEn ? 'Horizon (Years)' : 'Horizonte (Años)'}</label>
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
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{isEn ? 'Frequency' : 'Frecuencia'}</label>
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
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Benchmark</label>
          <input
            type="text"
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{isEn ? 'Dividends' : 'Dividendos'}</label>
          <select
            value={dividendMode}
            onChange={(e) => setDividendMode(e.target.value as DividendMode)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
          >
            <option value={DividendMode.PRICE_ONLY}>{isEn ? 'Price Only' : 'Solo Precio'}</option>
            <option value={DividendMode.TOTAL_RETURN_REAL}>Total Return (Real)</option>
            <option value={DividendMode.TOTAL_RETURN_APPROX}>{isEn ? 'Total Return (Approx)' : 'Total Return (Aprox)'}</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-grow bg-blue-600 text-white font-black py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all shadow-md text-sm uppercase tracking-widest active:scale-95"
          >
            {isLoading ? (isEn ? 'Fetching...' : 'Buscando...') : (isEn ? 'Analyze' : 'Analizar')}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="bg-white text-gray-400 border border-gray-200 font-bold py-2 px-3 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-sm active:scale-95"
            title={isEn ? 'Start Over' : 'Reiniciar Todo'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
};

export default AnalysisForm;
