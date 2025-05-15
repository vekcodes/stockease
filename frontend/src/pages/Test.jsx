import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import API from "@/lib/axios";

function Test() {
  const [data, setData] = useState(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    async function getData() {
      try {
        const response = await API.get("/stock_scraper/strategy/nabilbank/");
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    getData();
  }, []);

  useEffect(() => {
    if (!data || !chartContainerRef.current) return;

    // Clean up previous chart if it exists
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
    });

    // Create series
    const priceSeries = chart.addLineSeries({
      color: "#2962FF",
      lineWidth: 2,
    });

    const ma50Series = chart.addLineSeries({
      color: "#FFA726",
      lineWidth: 1,
    });

    const ma200Series = chart.addLineSeries({
      color: "#66BB6A",
      lineWidth: 1,
    });

    // Format data
    const formattedClose = data.data.map(item => ({
      time: item.date.split("T")[0],
      value: parseFloat(item.close),
    }));

    const formattedMA50 = data.data.map(item => ({
      time: item.date.split("T")[0],
      value: parseFloat(item.MA50),
    }));

    const formattedMA200 = data.data.map(item => ({
      time: item.date.split("T")[0],
      value: parseFloat(item.MA200),
    }));

    // Set data to series
    priceSeries.setData(formattedClose);
    ma50Series.setData(formattedMA50);
    ma200Series.setData(formattedMA200);

    // Store chart reference
    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [data]);

  return (
    <div className="p-4">
      <div ref={chartContainerRef} className="w-full h-[400px] mb-4" />
      
      {/* Data table */}
      {data ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Close</th>
                <th className="px-4 py-2 border">MA50</th>
                <th className="px-4 py-2 border">MA200</th>
                <th className="px-4 py-2 border">Signal</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{item.date}</td>
                  <td className="px-4 py-2 border">{item.close}</td>
                  <td className="px-4 py-2 border">{item.MA50}</td>
                  <td className="px-4 py-2 border">{item.MA200}</td>
                  <td className="px-4 py-2 border">
                    {item.Signal === 1 ? (
                      <span className="text-green-600">BUY</span>
                    ) : item.Signal === -1 ? (
                      <span className="text-red-600">SELL</span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">Loading data...</p>
      )}
    </div>
  );
}

export default Test;