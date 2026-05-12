'use client'

import { Bell, User, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Topbar() {
  const { user, signOut } = useAuth()
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-4">
      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
        <Bell size={20} className="text-gray-600" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium text-gray-700">{user?.email ?? ''}</span>
      </div>
      <button onClick={signOut} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Sair">
        <LogOut size={20} className="text-gray-600" />
      </button>
    </header>
  )
}
