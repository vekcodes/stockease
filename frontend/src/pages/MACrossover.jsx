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
  const [selectedStrategy, setSelectedStrategy] = useState("golden_cross");
  const [error, setError] = useState(null);
  const [crossoverSignals, setCrossoverSignals] = useState([]);
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);

  // Fetch available stock symbols
  useEffect(() => {
    async function getSymbols() {
      try {
        const response = await API.get('/stock_scraper/symbols/');
        if (response.data && response.data.symbols) {
          // Sort symbols alphabetically
          const sortedSymbols = [...response.data.symbols].sort();
          setSymbols(sortedSymbols);
          if (sortedSymbols.length > 0) {
            setSelectedSymbol(sortedSymbols[0]);
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
          processCrossoverSignals(response.data.data);
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

  const processCrossoverSignals = (data) => {
    const signals = [];
    const strategies = {
      golden_cross: { name: 'Golden Cross (50/200 MA)', short: 'MA50', long: 'MA200' },
      ema_short: { name: 'Short-term EMA (9/21)', short: 'EMA9', long: 'EMA21' },
      ema_medium: { name: 'Medium-term EMA (20/50)', short: 'EMA20', long: 'EMA50' }
    };

    Object.entries(strategies).forEach(([key, strategy]) => {
      let lastSignal = 0;
      let signalStart = null;
      let signalPrice = null;

      data.forEach((item, index) => {
        const currentSignal = item[`${key}_signal`];
        
        if (currentSignal !== 0 && currentSignal !== lastSignal) {
          if (signalStart) {
            signals.push({
              strategy: strategy.name,
              type: lastSignal === 1 ? 'BUY' : 'SELL',
              start: signalStart,
              end: item.date,
              crossoverPrice: signalPrice
            });
          }
          signalStart = item.date;
          signalPrice = item.close;
          lastSignal = currentSignal;
        }
      });

      // Add the last signal if it's still active
      if (signalStart && lastSignal !== 0) {
        signals.push({
          strategy: strategy.name,
          type: lastSignal === 1 ? 'BUY' : 'SELL',
          start: signalStart,
          end: 'Present',
          crossoverPrice: signalPrice
        });
      }
    });

    setCrossoverSignals(signals);
  };

  const getStrategyColors = (strategy) => {
    const colors = {
      golden_cross: { short: 'rgb(255, 99, 132)', long: 'rgb(54, 162, 235)' },    // 50 MA and 200 MA
      ema_short: { short: 'rgb(75, 192, 192)', long: 'rgb(153, 102, 255)' },      // 9 EMA and 21 EMA
      ema_medium: { short: 'rgb(255, 159, 64)', long: 'rgb(201, 203, 207)' }      // 20 EMA and 50 EMA
    };
    return colors[strategy] || colors.golden_cross;
  };

  const getChartData = () => {
    if (!data) return null;

    const strategy = data.metadata.strategies[selectedStrategy];
    const colors = getStrategyColors(selectedStrategy);

    return {
      labels: data.data.map(item => item.date),
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
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        beginAtZero: false,
        position: 'left',
        title: {
          display: true,
          text: 'Price'
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(2);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
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
      strategy: strategy
    };
  };

  const latestSignal = getLatestSignal();

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 relative">
        <label htmlFor="symbol-search" className="block text-sm font-medium text-gray-700 mb-2">
          Search Stock Symbol
        </label>
        <input
          id="symbol-search"
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setShowList(true);
          }}
          onFocus={() => setShowList(true)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-2 border-green-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
          placeholder="Type to search..."
        />
        {showList && (
          <ul className="absolute z-10 bg-white border border-gray-200 w-full max-h-48 overflow-y-auto rounded shadow mt-1">
            {symbols.filter(s => s.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <li className="px-4 py-2 text-gray-400">No results</li>
            ) : (
              symbols.filter(s => s.toLowerCase().includes(search.toLowerCase())).map(symbol => (
                <li
                  key={symbol}
                  className={`px-4 py-2 cursor-pointer hover:bg-green-100 ${symbol === selectedSymbol ? 'bg-green-50 font-semibold' : ''}`}
                  onClick={() => {
                    setSelectedSymbol(symbol);
                    setSearch(symbol);
                    setShowList(false);
                  }}
                >
                  {symbol}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Strategy Selection */}
      <div className="w-full">
        <label htmlFor="strategy" className="block text-sm font-medium text-gray-700 mb-1">
          Strategy
        </label>
        <select
          id="strategy"
          value={selectedStrategy}
          onChange={(e) => setSelectedStrategy(e.target.value)}
          className="w-full rounded-md border-2 border-green-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
        >
          {data && Object.entries(data.metadata.strategies).map(([key, strategy]) => (
            <option key={key} value={key}>
              {strategy.name}
            </option>
          ))}
        </select>
      </div>

      {/* Signal Card */}
      {latestSignal && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Latest Signal ({latestSignal.date})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Close Price</p>
              <p className="text-lg font-medium">{latestSignal.close.toFixed(2)}</p>
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
              <p className="text-sm text-gray-600">Strategy Type</p>
              <p className="text-lg font-medium">{latestSignal.strategy.type}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="h-[400px] md:h-[500px]">
          {getChartData() ? (
            <Line options={chartOptions} data={getChartData()} />
          ) : (
            <p className="text-gray-600">Loading chart...</p>
          )}
        </div>
      </div>

      {/* Crossover Signals Table */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4">
          {data ? `${data.metadata.strategies[selectedStrategy].name} Signals` : 'Crossover Signals'}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price at Crossover</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {crossoverSignals
                .filter(signal => {
                  const strategyMap = {
                    'golden_cross': 'Golden Cross (50/200 MA)',
                    'ema_short': 'Short-term EMA (9/21)',
                    'ema_medium': 'Medium-term EMA (20/50)'
                  };
                  return signal.strategy === strategyMap[selectedStrategy];
                })
                .map((signal, index) => {
                  const startDate = new Date(signal.start);
                  const endDate = signal.end === 'Present' ? new Date() : new Date(signal.end);
                  const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          signal.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {signal.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(signal.start).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {signal.end === 'Present' ? 'Present' : new Date(signal.end).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {signal.crossoverPrice ? signal.crossoverPrice.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {duration} days
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MACrossover; 