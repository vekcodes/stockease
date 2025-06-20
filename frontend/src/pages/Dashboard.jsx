import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import API from "@/lib/axios";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function RealizedPLChart() {
  const [transactionsChartData, setTransactionsChartData] = useState(null);
  const [realizedPL, setRealizedPL] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: investments } = await API.get("/stock_scraper/investments/");
        const buyData = [];
        const sellData = [];
        let totalProfitLoss = 0;

        investments.forEach((inv) => {
          buyData.push({
            x: new Date(inv.buy_date),
            y: inv.buy_price,
            symbol: inv.stock.symbol,
            quantity: inv.quantity,
          });
          if (inv.sell_date && inv.sell_price) {
            sellData.push({
              x: new Date(inv.sell_date),
              y: inv.sell_price,
              symbol: inv.stock.symbol,
              quantity: inv.quantity,
            });
            totalProfitLoss += (inv.sell_price - inv.buy_price) * inv.quantity;
          }
        });

        setTransactionsChartData({
          datasets: [
            {
              label: "Buy",
              data: buyData,
              backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
            {
              label: "Sell",
              data: sellData,
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        });
        setRealizedPL(totalProfitLoss);
      } catch (error) {
        console.error("Failed to fetch investment data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading realized P&L chart...</div>;
  return (
    <div className="mt-8">
      <div className="p-4 border rounded-lg bg-white shadow-sm mb-4">
        <h2 className="text-xl font-semibold mb-2">Realized P&amp;L</h2>
        <p className={`font-bold text-lg ${realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{realizedPL >= 0 ? '+' : ''}Rs.{realizedPL.toFixed(2)}</p>
      </div>
      {transactionsChartData ? (
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Buy &amp; Sell Transactions</h2>
          <Scatter
            data={transactionsChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: "Transaction History" },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const { symbol, quantity } = context.raw;
                      const price = context.parsed.y;
                      return `${context.dataset.label}: ${quantity} ${symbol} at Rs.${price.toFixed(2)}`;
                    },
                  },
                },
              },
              scales: {
                x: {
                  type: "time",
                  time: { unit: "day" },
                  title: { display: true, text: "Date" },
                },
                y: {
                  title: { display: true, text: "Price (Rs.)" },
                },
              },
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const [investmentCards, setInvestmentCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch investments
        const { data: investments } = await API.get("/stock_scraper/investments/");
        // Fetch latest stock prices
        const { data: stocksResp } = await API.get("/stock_scraper/stocks/");
        const stocksLatest = stocksResp.stocks;

        // Group unsold investments by symbol
        const grouped = {};
        investments.forEach(inv => {
          const symbol = inv.stock.symbol;
          // Only consider unsold investments
          if (!inv.sell_price && !inv.sell_date) {
            if (!grouped[symbol]) grouped[symbol] = [];
            grouped[symbol].push(inv);
          }
        });

        // Build card data for unsold stocks only
        const cards = Object.entries(grouped).map(([symbol, invs]) => {
          const totalShares = invs.reduce((sum, inv) => sum + inv.quantity, 0);
          const totalCost = invs.reduce((sum, inv) => sum + inv.buy_price * inv.quantity, 0);
          const avgBuyPrice = totalCost / totalShares;
          const latest = stocksLatest.find(s => s.symbol === symbol);
          const currentPrice = latest ? latest.close : null;
          let gain = 0, percent = 0, color = "";
          if (currentPrice !== null) {
            gain = (currentPrice - avgBuyPrice) * totalShares;
            percent = ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;
            color = gain >= 0 ? "text-green-500" : "text-red-500";
          }
          return {
            symbol,
            totalShares,
            avgBuyPrice,
            currentPrice,
            gain,
            percent,
            color,
          };
        });
        setInvestmentCards(cards);
      } catch (e) {
        setInvestmentCards([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="w-[95%] mx-auto pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-green-300/70 scrollbar-track-green-50/50 hover:scrollbar-thumb-green-400/80">
        <div className="flex gap-3 min-w-fit w-full">
          {loading ? (
            <div>Loading investments...</div>
          ) : investmentCards.length === 0 ? (
            <div>No investments found.</div>
          ) : (
            investmentCards.map((stock, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-[220px] md:w-[260px] bg-white p-4 rounded-xl shadow-sm border border-gray-300`}
              >
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  {stock.symbol}
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Shares</span>
                    <span className="font-medium">{stock.totalShares}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Buy Price</span>
                    <span className="font-medium">Rs.{stock.avgBuyPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Current Price</span>
                    <span className="font-medium">{stock.currentPrice ? `Rs.${stock.currentPrice.toFixed(2)}` : "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Unrealized P/L</span>
                    <div className={`flex items-center ${stock.color}`}>
                      {stock.gain > 0 ? (
                        <span className="mr-1">▲</span>
                      ) : (
                        <span className="mr-1">▼</span>
                      )}
                      <span>{Math.abs(stock.gain).toFixed(2)} ({Math.abs(stock.percent).toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="w-[95%] mx-auto mt-8">
        <RealizedPLChartContainer />
      </div>
    </>
  );
}

// Responsive wrapper for the chart
function RealizedPLChartContainer() {
  return (
    <div className="w-full h-[400px] max-w-full">
      <RealizedPLChart />
    </div>
  );
}
