import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  Users,
  UserCog,
  Award,
  FileText,
  ScanEye,
  PenTool,
  UsersRound,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface NavItem {
  label: string
  icon: React.ElementType
  path?: string
  children?: { label: string; path: string }[]
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard' },
  {
    label: 'Formations',
    icon: GraduationCap,
    children: [
      { label: 'Toutes les formations', path: '/courses' },
    ],
  },
  {
    label: 'Sessions',
    icon: CalendarDays,
    path: '/sessions',
  },
  {
    label: 'Apprenants',
    icon: Users,
    path: '/learners',
  },
  {
    label: 'Formateurs',
    icon: UserCog,
    path: '/signatories',
  },
  {
    label: 'Certificats',
    icon: Award,
    children: [
      { label: 'Tous les certificats', path: '/certificates' },
      { label: 'Générer', path: '/certificates/generate' },
    ],
  },
  {
    label: 'Modèles',
    icon: FileText,
    path: '/templates',
  },
  {
    label: 'Masques',
    icon: ScanEye,
    path: '/masks',
  },
  {
    label: 'Résultats',
    icon: PenTool,
    path: '/results',
  },
  {
    label: 'Utilisateurs',
    icon: UsersRound,
    path: '/users',
  },
  {
    label: 'Paramètres',
    icon: Settings,
    path: '/settings',
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    )
  }

  return (
    <aside
      className={cn(
        'h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 fixed left-0 top-0 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-gray-200 px-4', collapsed ? 'justify-center' : 'justify-between')}>
        {collapsed ? (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">EC</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">EC</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-primary leading-tight">EROSIS</h1>
                <p className="text-[10px] text-secondary font-medium leading-tight">CERTIFY</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedMenus.includes(item.label)

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
                    'text-gray-600 hover:bg-primary/5 hover:text-primary',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </>
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children!.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors duration-200',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path!}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-primary/5 hover:text-primary',
                  collapsed && 'justify-center'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Toggle button */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <><ChevronLeft className="h-5 w-5" /> <span>Réduire</span></>}
        </button>
      </div>
    </aside>
  )
}
