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

const TheGoldenCrossMomentum = () => {
  const [data, setData] = useState(null);
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [error, setError] = useState(null);
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
        console.log("Fetching data for symbol:", selectedSymbol);
        const response = await API.get(`/stock_scraper/strategy/${selectedSymbol}/`);
        console.log("API Response:", response);
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

  const priceChartData = data ? {
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
        label: 'MA50',
        data: data.data.map(item => item.MA50),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
      },
      {
        label: 'MA200',
        data: data.data.map(item => item.MA200),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.1,
      },
    ],
  } : null;

  const rsiChartData = data ? {
    labels: data.data.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'RSI',
        data: data.data.map(item => item.RSI),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.1,
      },
    ],
  } : null;

  const priceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Price and Moving Averages for ${selectedSymbol}`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const rsiChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `RSI for ${selectedSymbol}`,
      },
      annotation: {
        annotations: {
          overbought: {
            type: 'line',
            yMin: 70,
            yMax: 70,
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            label: {
              content: 'Overbought (70)',
              enabled: true,
              position: 'right'
            }
          },
          oversold: {
            type: 'line',
            yMin: 30,
            yMax: 30,
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 2,
            label: {
              content: 'Oversold (30)',
              enabled: true,
              position: 'right'
            }
          },
          neutral: {
            type: 'line',
            yMin: 50,
            yMax: 50,
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 2,
            label: {
              content: 'Neutral (50)',
              enabled: true,
              position: 'right'
            }
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          color: (context) => {
            if (context.tick.value === 70 || context.tick.value === 30 || context.tick.value === 50) {
              return 'rgba(255, 0, 0, 0.2)';
            }
            return 'rgba(0, 0, 0, 0.1)';
          },
        },
        ticks: {
          callback: function(value) {
            if (value === 70) return '70 (Overbought)';
            if (value === 30) return '30 (Oversold)';
            if (value === 50) return '50 (Neutral)';
            return value;
          }
        }
      },
    },
  };

  // Get RSI status
  const getRSIStatus = (rsi) => {
    if (rsi >= 70) return { text: 'Overbought', color: 'text-red-600' };
    if (rsi <= 30) return { text: 'Oversold', color: 'text-green-600' };
    return { text: 'Neutral', color: 'text-gray-600' };
  };

  // Get the latest signal
  const getLatestSignal = () => {
    if (!data || !data.data.length) return null;
    const latestData = data.data[data.data.length - 1];
    const rsiStatus = getRSIStatus(latestData.RSI);
    return {
      date: latestData.date,
      signal: latestData.Signal,
      close: latestData.close,
      ma50: latestData.MA50,
      ma200: latestData.MA200,
      rsi: latestData.RSI,
      rsiStatus: rsiStatus
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

      {/* Signal Card */}
      {latestSignal && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Latest Signal ({latestSignal.date})</h3>
          <div className="grid grid-cols-3 gap-4">
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
              <p className="text-sm text-gray-600">RSI</p>
              <p className={`text-lg font-medium ${latestSignal.rsiStatus.color}`}>
                {latestSignal.rsi.toFixed(2)} ({latestSignal.rsiStatus.text})
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">MA50</p>
              <p className="text-lg font-medium">{latestSignal.ma50}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">MA200</p>
              <p className="text-lg font-medium">{latestSignal.ma200}</p>
            </div>
          </div>
        </div>
      )}

      {/* Price Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="h-[400px]">
          {priceChartData ? (
            <Line options={priceChartOptions} data={priceChartData} />
          ) : (
            <p className="text-gray-600">Loading price chart...</p>
          )}
        </div>
      </div>

      {/* RSI Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">RSI Interpretation Guide:</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-red-600">RSI &gt; 70: Overbought</div>
            <div className="text-green-600">RSI &lt; 30: Oversold</div>
            <div className="text-gray-600">30-70: Neutral</div>
          </div>
        </div>
        <div className="h-[400px]">
          {rsiChartData ? (
            <Line options={rsiChartOptions} data={rsiChartData} />
          ) : (
            <p className="text-gray-600">Loading RSI chart...</p>
          )}
        </div>
      </div>
      
      {/* Data table */}
      {data ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Close</th>
                <th className="px-4 py-2 border">MA50</th>
                <th className="px-4 py-2 border">MA200</th>
                <th className="px-4 py-2 border">RSI</th>
                <th className="px-4 py-2 border">Signal</th>
              </tr>
            </thead>
            <tbody>
              {data.data.slice(-10).map((item, index) => {
                const rsiStatus = getRSIStatus(item.RSI);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{item.date}</td>
                    <td className="px-4 py-2 border">{item.close}</td>
                    <td className="px-4 py-2 border">{item.MA50}</td>
                    <td className="px-4 py-2 border">{item.MA200}</td>
                    <td className={`px-4 py-2 border ${rsiStatus.color}`}>
                      {item.RSI.toFixed(2)} ({rsiStatus.text})
                    </td>
                    <td className="px-4 py-2 border">
                      {item.Signal === 1 ? (
                        <span className="text-green-600">BUY</span>
                      ) : item.Signal === -1 ? (
                        <span className="text-red-600">SELL</span>
                      ) : (
                        <span className="text-gray-600">NEUTRAL</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">Loading data...</p>
      )}
    </div>
  );
};

export default TheGoldenCrossMomentum; 