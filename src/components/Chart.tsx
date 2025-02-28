import React, { useEffect, useRef } from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { X, BarChart, LineChart, PieChart } from 'lucide-react';
import Chart from 'chart.js/auto';
import { expandRange } from '../utils/formulas';

export function ChartDialog() {
  const { state, toggleChart, updateChartOptions, createChart } = useSheetStore();
  const { chartOpen, chartOptions, cells } = state;

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartOpen && chartRef.current) {
      const dataRange = chartOptions.dataRange;
      const labelRange = chartOptions.labelRange;

      if (!dataRange) return;

      const dataCells = expandRange(dataRange).map(ref => cells[ref]);
      const labels = labelRange 
        ? expandRange(labelRange).map(ref => cells[ref]?.value || '')
        : dataCells.map((_, index) => `Label ${index + 1}`);

      const data = dataCells.map(cell => {
        const value = cell?.computed !== undefined && cell?.computed !== null ? cell.computed : cell?.value;
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      });

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: chartOptions.type,
          data: {
            labels,
            datasets: [{
              label: chartOptions.title,
              data,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            }],
          },
          options: {
            scales: {
              y: { beginAtZero: true },
            },
          },
        });
      }
    }
  }, [chartOpen, chartOptions, cells]);

  if (!chartOpen) return null;

  return (
    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 shadow-lg rounded-md w-96 z-50">
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="font-medium">Create Chart</h3>
        <button className="p-1 rounded-full hover:bg-gray-100" onClick={toggleChart}>
          <X size={16} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <label className="block text-sm mb-1">Chart Title</label>
          <input 
            type="text"
            value={chartOptions.title}
            onChange={(e) => updateChartOptions({ title: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="Enter chart title"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Chart Type</label>
          <div className="flex space-x-2">
            <button 
              className={`flex items-center justify-center p-2 border rounded ${chartOptions.type === 'bar' ? 'bg-blue-100 border-blue-400' : ''}`}
              onClick={() => updateChartOptions({ type: 'bar' })}
            >
              <BarChart size={20} />
              <span className="ml-1">Bar</span>
            </button>
            <button 
              className={`flex items-center justify-center p-2 border rounded ${chartOptions.type === 'line' ? 'bg-blue-100 border-blue-400' : ''}`}
              onClick={() => updateChartOptions({ type: 'line' })}
            >
              <LineChart size={20} />
              <span className="ml-1">Line</span>
            </button>
            <button 
              className={`flex items-center justify-center p-2 border rounded ${chartOptions.type === 'pie' ? 'bg-blue-100 border-blue-400' : ''}`}
              onClick={() => updateChartOptions({ type: 'pie' })}
            >
              <PieChart size={20} />
              <span className="ml-1">Pie</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Data Range</label>
          <input 
            type="text"
            value={chartOptions.dataRange}
            onChange={(e) => updateChartOptions({ dataRange: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="e.g., A1:A10"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Label Range (optional)</label>
          <input 
            type="text"
            value={chartOptions.labelRange}
            onChange={(e) => updateChartOptions({ labelRange: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="e.g., B1:B10"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button className="px-3 py-1 bg-gray-100 text-sm rounded hover:bg-gray-200" onClick={toggleChart}>
            Cancel
          </button>
          <button 
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            onClick={createChart}
            disabled={!chartOptions.dataRange}
          >
            Create Chart
          </button>
        </div>
      </div>

      <div className="p-3">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

// Export the Chart component properly
export default ChartDialog;
