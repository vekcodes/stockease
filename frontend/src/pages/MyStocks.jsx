import React, { useEffect, useState } from "react";
import API from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const MyStocks = () => {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyDate, setBuyDate] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellDate, setSellDate] = useState("");
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  useEffect(() => {
    fetchInvestments();
    fetchSymbols();
  }, [navigate]);

  const fetchInvestments = async () => {
    try {
      const response = await API.get('/stock_scraper/investments/');
      if (response.data) {
        setInvestments(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching investments:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const fetchSymbols = async () => {
    try {
      const response = await API.get('/stock_scraper/symbols/');
      if (response.data && response.data.symbols) {
        setSymbols(response.data.symbols);
      }
    } catch (err) {
      console.error('Error fetching symbols:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleAddInvestment = async (e) => {
    e.preventDefault();
    if (!selectedSymbol || !buyPrice || !quantity || !buyDate) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await API.post('/stock_scraper/investments/add/', {
        stock: selectedSymbol,
        buy_price: parseFloat(buyPrice),
        quantity: parseInt(quantity),
        buy_date: buyDate,
      });
      
      if (response.data) {
        setInvestments([...investments, response.data]);
        setSelectedSymbol("");
        setBuyPrice("");
        setQuantity("");
        setBuyDate("");
      }
    } catch (err) {
      console.error('Error adding investment:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleSellInvestment = async (investment) => {
    if (!sellPrice || !sellDate) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await API.patch(`/stock_scraper/investments/${investment.id}/`, {
        sell_price: parseFloat(sellPrice),
        sell_date: sellDate,
      });
      
      if (response.data) {
        setInvestments(investments.map(inv => 
          inv.id === investment.id ? response.data : inv
        ));
        setSelectedInvestment(null);
        setSellPrice("");
        setSellDate("");
      }
    } catch (err) {
      console.error('Error selling investment:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const calculatePL = (investment) => {
    if (!investment.sell_price) return null;
    const pl = (investment.sell_price - investment.buy_price) * investment.quantity;
    const plPercentage = ((investment.sell_price - investment.buy_price) / investment.buy_price) * 100;
    return {
      value: pl.toFixed(2),
      percentage: plPercentage.toFixed(2)
    };
  };

  const getChangeColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getRowColor = (value) => {
    if (value > 0) return 'bg-green-50 hover:bg-green-100';
    if (value < 0) return 'bg-red-50 hover:bg-red-100';
    return 'hover:bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Stocks</h1>

      {/* Add Stock Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Stock</h2>
        <form onSubmit={handleAddInvestment} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="symbol">Stock Symbol</Label>
            <select
              id="symbol"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="">Select a symbol</option>
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="buyPrice">Buy Price</Label>
            <Input
              id="buyPrice"
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="Enter buy price"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="mt-1"
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="buyDate">Buy Date</Label>
            <Input
              id="buyDate"
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Add Stock
            </Button>
          </div>
        </form>
      </div>

      {/* Sell Form */}
      {selectedInvestment && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Sell {selectedInvestment.stock.symbol}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sellPrice">Sell Price</Label>
              <Input
                id="sellPrice"
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="Enter sell price"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sellDate">Sell Date</Label>
              <Input
                id="sellDate"
                type="date"
                value={sellDate}
                onChange={(e) => setSellDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={() => handleSellInvestment(selectedInvestment)}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Confirm Sale
              </Button>
              <Button 
                onClick={() => {
                  setSelectedInvestment(null);
                  setSellPrice("");
                  setSellDate("");
                }}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Investments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bought At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {investments.map((investment, index) => {
                const pl = calculatePL(investment);
                const plColor = pl ? getChangeColor(pl.value) : 'text-gray-600';
                const rowColor = pl ? getRowColor(pl.value) : 'hover:bg-gray-50';
                
                return (
                  <tr key={`${investment.stock.symbol}-${index}`} className={rowColor}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {investment.stock.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {investment.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${investment.buy_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {pl ? (
                        <span className={plColor}>
                          {pl.percentage}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {pl ? (
                        <span className={plColor}>
                          ${pl.value}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {investment.buy_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {!investment.sell_price && (
                        <Button 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setSelectedInvestment(investment)}
                        >
                          Sell
                        </Button>
                      )}
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

export default MyStocks;
    