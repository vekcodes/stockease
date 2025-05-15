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
import { Outlet } from "react-router-dom"
import { useLocation, Link } from "react-router-dom"

export default function Layout() {
  const location = useLocation()
const breadcrumbs = generateBreadcrumbs(location.pathname)

  function generateBreadcrumbs(pathname) {
    const pathnames = pathname.split("/").filter((x) => x)
    return pathnames.map((value, index) => {
      const href = "/" + pathnames.slice(0, index + 1).join("/")
      return {
        label: value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        href,
      }
    })
  }
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
  <BreadcrumbList>
    {breadcrumbs.map((crumb, index) => (
      <BreadcrumbItem key={crumb.href} className="capitalize">
        {index < breadcrumbs.length - 1 ? (
          <>
            <BreadcrumbLink asChild>
              <Link to={crumb.href}>{crumb.label}</Link>
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </>
        ) : (
          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
        )}
      </BreadcrumbItem>
    ))}
  </BreadcrumbList>
</Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet/>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
