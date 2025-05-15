import * as React from "react"
import {
  AudioWaveform,
  Siren,
  BriefcaseBusiness,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  Newspaper,
  ChartCandlestick,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Bivek",
    email: "shakyab838@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "News Sentiment Analysis",
      url: "/golden-cross-momentum",
      icon: Newspaper,
      isActive: true,
    },
    {
      title: "Strategies",
      icon: ChartCandlestick,
      items: [
        {
          title: "The Golden Cross Momentum",
          url: "/golden-cross-momentum",
        },
        {
          title: "MA Crossover",
          url: "/ma-crossover",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Portfolio",
      url: "#",
      icon: BriefcaseBusiness,
      items: [
        {
          title: "Stock Screener",
          url: "/stock-screener",
        },
        {
          title: "My Stocks",
          url: "#",
        }
      ],
    },
    {
      title: "Alerts",
      url: "#",
      icon: Siren,
      items: [
        {
          title: "Buy",
          url: "#",
        },
        {
          title: "Sell",
          url: "#",
        },
      ],
    },
  ],
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: Map,
  //   },
  // ],
}

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
