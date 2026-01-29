
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, LineStyle } from 'lightweight-charts';
import { PricePoint } from '../types';

interface ChartProps {
  data: PricePoint[];
  title: string;
  overlayData?: { data: PricePoint[]; color: string; name: string }[];
  height?: number;
}

const Chart: React.FC<ChartProps> = ({ data, title, overlayData, height = 450 }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    
    const formatData = (pts: PricePoint[]) => {
      return pts
        .map(d => ({ 
          time: d.time, 
          value: d.value 
        }))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    };

    const sortedData = formatData(data);
    if (sortedData.length === 0) return;

    const seenTimes = new Set();
    const uniqueData = sortedData.filter(d => {
      if (seenTimes.has(d.time)) return false;
      seenTimes.add(d.time);
      return true;
    });

    try {
      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#64748b',
          fontSize: 11,
        },
        width: container.clientWidth || 600,
        height: height,
        grid: {
          vertLines: { color: '#f1f5f9' },
          horzLines: { color: '#f1f5f9' },
        },
        timeScale: {
          borderVisible: false,
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderVisible: false,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        handleScroll: true,
        handleScale: true,
      });

      const mainSeries = chart.addLineSeries({
        color: '#2563eb',
        lineWidth: 2.5,
        priceLineVisible: true,
        lastValueVisible: true,
        title: '', // Removed 'Ratio' to prevent label overlap on the axis
      });

      mainSeries.setData(uniqueData);

      if (overlayData) {
        overlayData.forEach(overlay => {
          const isLongTerm = overlay.name.toLowerCase().includes('w');
          const s = chart.addLineSeries({
            color: overlay.color,
            lineWidth: isLongTerm ? 1 : 1.2, 
            lineStyle: LineStyle.Solid,
            priceLineVisible: false,
            lastValueVisible: false,
            title: '', 
          });
          
          const sortedOverlay = formatData(overlay.data);
          const seenOverlayTimes = new Set();
          const uniqueOverlay = sortedOverlay.filter(d => {
            if (seenOverlayTimes.has(d.time)) return false;
            seenOverlayTimes.add(d.time);
            return true;
          });
          
          s.setData(uniqueOverlay);
        });
      }

      chart.timeScale().fitContent();
      chartRef.current = chart;

      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !chartRef.current) return;
        const { width } = entries[0].contentRect;
        chartRef.current.applyOptions({ width });
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    } catch (err) {
      console.error("Chart rendering error:", err);
    }
  }, [data, overlayData, height]);

  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-gray-100 flex flex-col w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{title}</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-blue-600 rounded-full"></span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ratio</span>
          </div>
          {overlayData?.map((o, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span 
                className={`w-4 h-0.5 rounded-full`} 
                style={{ backgroundColor: o.color, height: o.name.toLowerCase().includes('w') ? '1px' : '1.5px' }}
              ></span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{o.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full flex-grow" style={{ minHeight: height }} />
    </div>
  );
};

export default Chart;
