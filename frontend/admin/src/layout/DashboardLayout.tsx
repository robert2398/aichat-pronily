import React from 'react'
import { 
  DollarSign, 
  CreditCard, 
  Coins, 
  Users, 
  TrendingUp
} from 'lucide-react'
import { cn } from '../lib/utils'
import { FiltersProvider } from '../context/FiltersContext'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

const sidebarSections = [
  {
    title: 'Monetization',
    icon: DollarSign,
    items: [
      { name: 'KPIs', href: '#kpis' },
      { name: 'Revenue Trends', href: '#revenue-trends' },
    ]
  },
  {
    title: 'Subscriptions',
    icon: CreditCard,
    items: [
      { name: 'Plan Summary', href: '#subscription-plans' },
      { name: 'History', href: '#subscription-history' },
    ]
  },
  {
    title: 'Coins',
    icon: Coins,
    items: [
      { name: 'Purchases', href: '#coins-purchased' },
      { name: 'Usage by Feature', href: '#coins-by-feature' },
      { name: 'Trends', href: '#coins-trends' },
    ]
  },
  {
    title: 'Engagement',
    icon: Users,
    items: [
      { name: 'Top Spenders', href: '#top-spenders' },
      { name: 'Top Active Users', href: '#top-active' },
      { name: 'Feature Breakdown', href: '#feature-engagement' },
      { name: 'Top Characters', href: '#top-characters' },
    ]
  },
  {
    title: 'Promotions',
    icon: TrendingUp,
    items: [
      { name: 'Performance', href: '#promotions-performance' },
    ]
  }
]

function Sidebar() {
  return (
    <div className="w-64 h-full bg-card border-r border-border">
      <div className="p-6">
        <h1 className="text-lg font-semibold text-foreground">Analytics Dashboard</h1>
      </div>
      <nav className="px-4 space-y-2">
        {sidebarSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="flex items-center px-2 py-2 text-sm font-medium text-muted-foreground">
              <section.icon className="w-4 h-4 mr-2" />
              {section.title}
            </div>
            <div className="ml-6 space-y-1">
              {section.items.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <FiltersProvider>
      <div className={cn("min-h-screen bg-background", className)}>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </FiltersProvider>
  )
}