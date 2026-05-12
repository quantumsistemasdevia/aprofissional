'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Factory,
  KanbanSquare,
  Package,
  BarChart3,
  Settings,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const menuGroups = [
  {
    label: 'Operação',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
      { label: 'Clientes', href: '/clientes', icon: Users },
      { label: 'Produção', href: '/producao', icon: Factory, exact: true },
      { label: 'Dashboard Produção', href: '/producao/dashboard', icon: KanbanSquare },
      { label: 'Compra de Materiais', href: '/compra-materiais', icon: ShoppingBag },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Catálogo', href: '/catalogo', icon: Package },
      { label: 'Relatórios', href: '/relatorios', icon: BarChart3 },
      { label: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true')
  }, [])

  function toggle() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <aside
      className={[
        'min-h-screen flex-shrink-0 flex flex-col bg-[#FFF5F5] transition-all duration-200',
        mounted && collapsed ? 'w-16' : 'w-64',
      ].join(' ')}
    >
      {/* Logo */}
      <div className={['flex items-center py-6', collapsed ? 'justify-center px-3' : 'gap-3 px-5'].join(' ')}>
        <div className="w-10 h-10 relative flex-shrink-0 overflow-hidden rounded-full">
          <Image
            src="/LogoAProfissional.png"
            alt="Logo"
            fill
            className="object-cover object-left"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-bold italic text-base text-[#C41E3A] whitespace-nowrap">
              A Profissional
            </span>
            <span className="text-[10px] tracking-[0.18em] uppercase font-medium text-gray-400">
              Uniformes
            </span>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-2 mt-1">
        {menuGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
            {collapsed ? (
              gi > 0 && <div className="border-t border-[#FCE8E8] my-2 mx-1" />
            ) : (
              <span className="block px-3 mb-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-gray-400">
                {group.label}
              </span>
            )}

            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'group relative flex items-center py-2.5 text-sm transition-colors duration-150 rounded-lg mb-0.5',
                    collapsed
                      ? 'justify-center px-2'
                      : 'gap-3 pr-4 rounded-r-lg',
                    'hover:bg-[#FCE8E8] hover:text-[#9B1C1C] hover:font-semibold',
                    isActive
                      ? [
                          'bg-[#FCE8E8] text-[#9B1C1C] font-semibold',
                          collapsed ? '' : 'pl-3 border-l-4 border-[#C41E3A]',
                        ].join(' ')
                      : [
                          'text-gray-500 font-normal',
                          collapsed ? '' : 'pl-4 border-l-4 border-transparent',
                        ].join(' '),
                  ].join(' ')}
                >
                  <Icon
                    size={18}
                    className={[
                      'flex-shrink-0 transition-colors duration-150',
                      isActive ? 'text-[#C41E3A]' : 'text-gray-400 group-hover:text-[#C41E3A]',
                    ].join(' ')}
                  />

                  {!collapsed && <span className="truncate">{item.label}</span>}

                  {/* Tooltip quando recolhido */}
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      {item.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Botão de colapso */}
      <div className="px-2 py-2">
        <button
          onClick={toggle}
          className={[
            'w-full flex items-center py-2 px-2 text-gray-400 hover:text-[#C41E3A] hover:bg-[#FCE8E8] rounded-lg transition-colors',
            collapsed ? 'justify-center' : 'justify-end',
          ].join(' ')}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Rodapé */}
      <div className={['border-t border-[#FCE8E8]', collapsed ? 'py-4' : 'px-5 py-4 flex flex-col items-center gap-2'].join(' ')}>
        {!collapsed && (
          <>
            <span className="text-[11px] text-gray-300">Desenvolvido por</span>
            <Image
              src="/LogoQuantum.png"
              alt="Quantum"
              width={90}
              height={28}
              className="object-contain opacity-40"
              style={{ height: 'auto' }}
            />
          </>
        )}
      </div>
    </aside>
  )
}
