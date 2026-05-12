import { useAuth } from './useAuth'

type Permission =
  | 'criar_pedido' | 'editar_pedido' | 'aprovar_pedido'
  | 'gerenciar_producao' | 'gerenciar_catalogo'
  | 'gerenciar_clientes' | 'ver_relatorios'
  | 'gerenciar_configuracoes' | 'soft_delete'

const permissionMap: Record<Permission, Array<'admin' | 'vendedor' | 'producao'>> = {
  criar_pedido: ['admin', 'vendedor'],
  editar_pedido: ['admin', 'vendedor'],
  aprovar_pedido: ['admin', 'vendedor'],
  gerenciar_producao: ['admin', 'producao'],
  gerenciar_catalogo: ['admin'],
  gerenciar_clientes: ['admin', 'vendedor'],
  ver_relatorios: ['admin'],
  gerenciar_configuracoes: ['admin'],
  soft_delete: ['admin'],
}

export function usePermission() {
  const { user } = useAuth()
  const hasPermission = (p: Permission) => !!user && (permissionMap[p]?.includes(user.perfil) ?? false)
  const canAll = (...ps: Permission[]) => ps.every(hasPermission)
  return { hasPermission, canAll }
}
