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

export default function Dashboard() {
  const stocks = [
    { 
      name: "Meta",
      price: "$157.36",
      change: -0.1,
      color: "text-red-500"
    },
    { 
      name: "Google",
      price: "$743.76",
      change: 0.95,
      color: "text-green-500"
    },
    { 
      name: "Tesla",
      price: "$234.09",
      change: -1.1,
      color: "text-red-500"
    },
    { 
      name: "Microsoft",
      price: "$410.5",
      change: -2.9,
      color: "text-red-500"
    }
  ];
  return (
<>
<div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4 px-4" style={{ minWidth: "min-content" }}>
        {stocks.map((stock, index) => (
          <div 
            key={index}
            className="flex-shrink-0 w-[280px] md:w-[320px] bg-white p-6 rounded-xl shadow-sm border border-gray-300"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {stock.name}
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Share</span>
                <span className="font-medium">{stock.price}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Return</span>
                <div className={`flex items-center ${stock.color}`}>
                  {stock.change > 0 ? (
                    <span className="mr-1">▲</span>
                  ) : (
                    <span className="mr-1">▼</span>
                  )}
                  <span>{Math.abs(stock.change)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
</>

  )
}
