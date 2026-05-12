'use client'

import { useState, useEffect } from 'react'
import { useWizard } from '../WizardProvider'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useCustomers, type Cliente } from '@/hooks/useCustomers'
import { useUsers } from '@/hooks/useUsers'
import { apiFetch } from '@/lib/api'

type ERPResult = { erp_id: string; nome: string; cpf_cnpj: string; tipo: string }

export function StepCliente() {
  const { state, updatePedido, setCurrentStep } = useWizard()
  const { clientes, loading: loadingClientes, list: listClientes } = useCustomers()
  const { usuarios, loading: loadingUsers, list: listUsers } = useUsers()
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(false)
  const [erpSearch, setErpSearch] = useState('')
  const [erpResults, setErpResults] = useState<ERPResult[]>([])
  const [searchingErp, setSearchingErp] = useState(false)

  useEffect(() => { listClientes(); listUsers() }, [listClientes, listUsers])

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.cpf_cnpj ?? '').includes(search)
  )

  const vendedores = usuarios.filter(u => u.perfil === 'vendedor' || u.perfil === 'admin')

  const clienteSelecionado = clientes.find(c => c.id === state.pedido.cliente_id)

  function selectCliente(c: Cliente) {
    updatePedido({ cliente_id: c.id })
    setSearch('')
    setShowList(false)
  }

  async function searchERP() {
    if (!erpSearch.trim()) return
    setSearchingErp(true)
    try {
      const results = await apiFetch<ERPResult[]>(
        `/api/customers/search-erp?q=${encodeURIComponent(erpSearch)}`
      )
      setErpResults(results)
    } catch {
      setErpResults([])
    } finally {
      setSearchingErp(false)
    }
  }

  async function importarDoERP(erpId: string) {
    try {
      await apiFetch(`/api/customers/sync-erp/${erpId}`, { method: 'POST' })
      await listClientes()
      setErpResults([])
    } catch {
      // handle silently
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Selecione o Cliente</h2>
        {clienteSelecionado && (
          <div className="mb-3 flex items-center justify-between p-3 rounded border border-brand-primary bg-red-50">
            <div>
              <p className="font-medium">{clienteSelecionado.nome}</p>
              {clienteSelecionado.cpf_cnpj && (
                <p className="text-sm text-gray-500">{clienteSelecionado.cpf_cnpj}</p>
              )}
            </div>
            <button
              className="text-xs text-gray-400 hover:text-gray-600"
              onClick={() => { updatePedido({ cliente_id: '' }); setSearch('') }}
            >
              Trocar
            </button>
          </div>
        )}
        <div className="relative">
          <Input
            placeholder="Buscar por nome ou CPF/CNPJ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setShowList(true)}
            onBlur={() => setTimeout(() => setShowList(false), 150)}
          />
          {showList && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
              {loadingClientes || loadingUsers ? (
                <div className="flex justify-center p-4"><Spinner /></div>
              ) : filtered.length === 0 ? (
                <p className="p-3 text-sm text-gray-400">Nenhum cliente encontrado</p>
              ) : filtered.map(c => (
                <div
                  key={c.id}
                  onMouseDown={() => selectCliente(c)}
                  className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <p className="font-medium">{c.nome}</p>
                  {c.cpf_cnpj && <p className="text-sm text-gray-500">{c.cpf_cnpj}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Buscar no ERP</p>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar no ERP..."
            value={erpSearch}
            onChange={e => setErpSearch(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && searchERP()}
          />
          <Button variant="outline" onClick={searchERP} disabled={searchingErp}>
            {searchingErp ? '...' : 'Buscar'}
          </Button>
        </div>
        {erpResults.length > 0 && (
          <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
            {erpResults.map(r => (
              <div key={r.erp_id} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                <div>
                  <p className="text-sm font-medium">{r.nome}</p>
                  <p className="text-xs text-gray-500">{r.cpf_cnpj} — ERP: {r.erp_id}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => importarDoERP(r.erp_id)}>Importar</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Previsão de Entrega"
          type="date"
          value={state.pedido.previsao_entrega ?? ''}
          onChange={e => updatePedido({ previsao_entrega: e.target.value })}
        />
        <Select
          label="Vendedor Responsável"
          options={[{ value: '', label: 'Selecione...' }, ...vendedores.map(v => ({ value: v.id, label: v.nome }))]}
          value={state.pedido.vendedor_id ?? ''}
          onChange={e => updatePedido({ vendedor_id: e.target.value })}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCurrentStep(2)} disabled={!state.pedido.cliente_id}>
          Próximo →
        </Button>
      </div>
    </div>
  )
}
