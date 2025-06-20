import React, { useEffect, useState } from "react";
import API from "@/lib/axios";

function SignalBadge({ value }) {
  let color = "bg-gray-200 text-gray-700";
  if (value === "Buy") color = "bg-green-100 text-green-700";
  else if (value === "Sell") color = "bg-red-100 text-red-700";
  return (
    <span className={`inline-block px-3 py-1 rounded-full font-semibold text-xs ${color}`}>{value}</span>
  );
}

export default function BuySellNeutral() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch all symbols
        const symbolsResp = await API.get('/stock_scraper/symbols/');
        const symbols = symbolsResp.data.symbols || [];
        // Fetch volatility data
        const stocksResp = await API.get('/stock_scraper/stocks/');
        const stocksData = stocksResp.data.stocks || [];
        // For each symbol, fetch Golden Cross Momentum/RSI and MA crossover signals
        const allRows = await Promise.all(symbols.map(async (symbol) => {
          try {
            // Golden Cross Momentum & RSI
            const gcmResp = await API.get(`/stock_scraper/strategy/${symbol}/`);
            const gcmData = gcmResp.data && gcmResp.data.data && gcmResp.data.data.length > 0 ? gcmResp.data.data[gcmResp.data.data.length - 1] : null;
            // Short/Mid Term from MA crossover
            const maResp = await API.get(`/stock_scraper/ma_crossover/${symbol}/`);
            const maData = maResp.data && maResp.data.data && maResp.data.data.length > 0 ? maResp.data.data[maResp.data.data.length - 1] : null;
            // Volatility
            const stockInfo = stocksData.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
            return {
              stock: symbol,
              rsi: gcmData && gcmData.RSI ? gcmData.RSI.toFixed(2) : '-',
              volatility: stockInfo?.volatility ? stockInfo.volatility.toFixed(2) : '-',
              goldenCross: gcmData && gcmData.Signal === 1 ? 'Buy' : gcmData && gcmData.Signal === -1 ? 'Sell' : 'Neutral',
              shortTerm: maData && maData.ema_short_signal === 1 ? 'Buy' : maData && maData.ema_short_signal === -1 ? 'Sell' : 'Neutral',
              midTerm: maData && maData.ema_medium_signal === 1 ? 'Buy' : maData && maData.ema_medium_signal === -1 ? 'Sell' : 'Neutral',
            };
          } catch (e) {
            return null;
          }
        }));
        setRows(allRows.filter(row => row));
      } catch (e) {
        setError('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="w-4/5 mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Alert Signal</h1>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">SN</th>
                <th className="px-4 py-2 text-left">Stock</th>
                <th className="px-4 py-2 text-left">RSI</th>
                <th className="px-4 py-2 text-left">Volatility</th>
                <th className="px-4 py-2 text-left">The Golden Cross Momentum</th>
                <th className="px-4 py-2 text-left">Short Term</th>
                <th className="px-4 py-2 text-left">Mid Term</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No data found.</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.stock} className="border-t">
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2 font-semibold">{row.stock}</td>
                    <td className="px-4 py-2">{row.rsi}</td>
                    <td className="px-4 py-2">{row.volatility}</td>
                    <td className="px-4 py-2"><SignalBadge value={row.goldenCross} /></td>
                    <td className="px-4 py-2"><SignalBadge value={row.shortTerm} /></td>
                    <td className="px-4 py-2"><SignalBadge value={row.midTerm} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 