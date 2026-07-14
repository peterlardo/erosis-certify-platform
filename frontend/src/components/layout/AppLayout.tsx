import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  LogOut,
  UserCircle,
  ChevronDown,
} from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Avatar } from '../ui/avatar'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-light-gray">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-300 min-h-screen',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          {/* Search */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-secondary" />
            </button>

            {/* User menu */}
            <DropdownMenu
              trigger={
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <Avatar fallback={`${user?.firstName} ${user?.lastName}`} size="sm" />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700 leading-tight">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
                </button>
              }
              align="end"
            >
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <UserCircle className="h-4 w-4 mr-2" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
