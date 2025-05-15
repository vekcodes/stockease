import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import API from "@/lib/axios";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MACrossover = () => {
  const [data, setData] = useState(null);
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("fast_ma");
  const [error, setError] = useState(null);

  // Fetch available stock symbols
  useEffect(() => {
    async function getSymbols() {
      try {
        const response = await API.get('/stock_scraper/symbols/');
        if (response.data && response.data.symbols) {
          setSymbols(response.data.symbols);
          if (response.data.symbols.length > 0) {
            setSelectedSymbol(response.data.symbols[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching symbols:", error);
        setError("Failed to fetch stock symbols");
      }
    }
    getSymbols();
  }, []);

  // Fetch data for selected symbol
  useEffect(() => {
    if (!selectedSymbol) return;

    async function getData() {
      try {
        const response = await API.get(`/stock_scraper/ma_crossover/${selectedSymbol}/`);
        if (response.data && response.data.data) {
          setData(response.data);
          setError(null);
        } else {
          setError("Invalid data format received from API");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to fetch data");
      }
    }
    getData();
  }, [selectedSymbol]);

  const getStrategyColors = (strategy) => {
    const colors = {
      fast_ma: { short: 'rgb(255, 99, 132)', long: 'rgb(54, 162, 235)' },
      swing_ema: { short: 'rgb(75, 192, 192)', long: 'rgb(153, 102, 255)' },
      balanced_ma: { short: 'rgb(255, 159, 64)', long: 'rgb(201, 203, 207)' },
      slow_ma: { short: 'rgb(255, 205, 86)', long: 'rgb(54, 162, 235)' },
      fib_ema: { short: 'rgb(75, 192, 192)', long: 'rgb(255, 99, 132)' }
    };
    return colors[strategy] || colors.fast_ma;
  };

  const getChartData = () => {
    if (!data) return null;

    const strategy = data.metadata.strategies[selectedStrategy];
    const colors = getStrategyColors(selectedStrategy);

    return {
      labels: data.data.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Close Price',
          data: data.data.map(item => item.close),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
        },
        {
          label: strategy.short_ma,
          data: data.data.map(item => item[strategy.short_ma]),
          borderColor: colors.short,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1,
        },
        {
          label: strategy.long_ma,
          data: data.data.map(item => item[strategy.long_ma]),
          borderColor: colors.long,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          tension: 0.1,
        },
        {
          label: 'Volatility',
          data: data.data.map(item => item.Volatility),
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          tension: 0.1,
          yAxisID: 'volatility',
        }
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: data ? `${data.metadata.strategies[selectedStrategy].name} for ${selectedSymbol}` : '',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        position: 'left',
      },
      volatility: {
        beginAtZero: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Get the latest signal
  const getLatestSignal = () => {
    if (!data || !data.data.length) return null;
    const latestData = data.data[data.data.length - 1];
    const strategy = data.metadata.strategies[selectedStrategy];
    return {
      date: latestData.date,
      signal: latestData[`${selectedStrategy}_signal`],
      close: latestData.close,
      short_ma: latestData[strategy.short_ma],
      long_ma: latestData[strategy.long_ma],
      volatility: latestData.Volatility,
      strategy: strategy
    };
  };

  const latestSignal = getLatestSignal();

  const calculateSignals = (data) => {
    if (!data || data.length === 0) return null;
    
    const lookbackPeriod = 5; // Look at last 5 days for signals
    const signals = {};
    
    strategies.forEach(strategy => {
      const signalKey = `${strategy.key}_signal`;
      // Get the most recent non-zero signal within lookback period
      const recentSignals = data.slice(-lookbackPeriod).map(row => row[signalKey]);
      const lastSignal = recentSignals.reverse().find(signal => signal !== 0);
      
      if (lastSignal === 1) {
        signals[strategy.key] = 'buy';
      } else if (lastSignal === -1) {
        signals[strategy.key] = 'sell';
      } else {
        signals[strategy.key] = 'neutral';
      }
    });
    
    return signals;
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Symbol Selection */}
        <div className="max-w-xs">
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-700">
            Stock Symbol
          </label>
          <select
            id="symbol"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>

        {/* Strategy Selection */}
        <div className="max-w-xs">
          <label htmlFor="strategy" className="block text-sm font-medium text-gray-700">
            Strategy
          </label>
          <select
            id="strategy"
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {data && Object.entries(data.metadata.strategies).map(([key, strategy]) => (
              <option key={key} value={key}>
                {strategy.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Signal Card */}
      {latestSignal && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Latest Signal ({latestSignal.date})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Close Price</p>
              <p className="text-lg font-medium">{latestSignal.close}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Signal</p>
              <p className={`text-lg font-medium ${
                latestSignal.signal === 1 ? 'text-green-600' :
                latestSignal.signal === -1 ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {latestSignal.signal === 1 ? 'BUY' :
                 latestSignal.signal === -1 ? 'SELL' :
                 'NEUTRAL'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Volatility</p>
              <p className="text-lg font-medium">{latestSignal.volatility.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Strategy Type</p>
              <p className="text-lg font-medium">{latestSignal.strategy.type} ({latestSignal.strategy.speed})</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">Use Case</p>
            <p className="text-base">{latestSignal.strategy.use_case}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="h-[400px]">
          {getChartData() ? (
            <Line options={chartOptions} data={getChartData()} />
          ) : (
            <p className="text-gray-600">Loading chart...</p>
          )}
        </div>
      </div>

      {/* Strategy Guide */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Strategy Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data && Object.entries(data.metadata.strategies).map(([key, strategy]) => (
            <div key={key} className="p-4 border rounded-lg">
              <h4 className="font-medium text-lg mb-2">{strategy.name}</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Type:</span> {strategy.type}</p>
                <p><span className="font-medium">Speed:</span> {strategy.speed}</p>
                <p><span className="font-medium">Use Case:</span> {strategy.use_case}</p>
                <p><span className="font-medium">Indicators:</span> {strategy.short_ma} / {strategy.long_ma}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MACrossover; 