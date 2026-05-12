'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useCustomers, type Cliente } from '@/hooks/useCustomers'

export default function ClientesPage() {
  const { clientes, loading, list, create, remove } = useCustomers()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCliente, setEditCliente] = useState<Cliente | null>(null)
  const [form, setForm] = useState({
    nome: '',
    tipo: 'fisica' as 'fisica' | 'juridica',
    cpf_cnpj: '',
    email: '',
    telefone: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { list() }, [list])

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.cpf_cnpj ?? '').includes(search)
  )

  function openCreate() {
    setEditCliente(null)
    setForm({ nome: '', tipo: 'fisica', cpf_cnpj: '', email: '', telefone: '' })
    setShowModal(true)
  }

  function openEdit(c: Cliente) {
    setEditCliente(c)
    setForm({
      nome: c.nome,
      tipo: c.tipo,
      cpf_cnpj: c.cpf_cnpj ?? '',
      email: c.email ?? '',
      telefone: c.telefone ?? '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await create({
        nome: form.nome,
        tipo: form.tipo,
        cpf_cnpj: form.cpf_cnpj || undefined,
        email: form.email || undefined,
        telefone: form.telefone || undefined,
      })
      setShowModal(false)
      list()
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'nome', header: 'Nome' },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (c: Cliente) => (
        <Badge variant={c.tipo === 'juridica' ? 'info' : 'default'}>
          {c.tipo === 'juridica' ? 'Jurídica' : 'Física'}
        </Badge>
      ),
    },
    { key: 'cpf_cnpj', header: 'CPF/CNPJ', render: (c: Cliente) => c.cpf_cnpj ?? '-' },
    { key: 'email', header: 'Email', render: (c: Cliente) => c.email ?? '-' },
    { key: 'telefone', header: 'Telefone', render: (c: Cliente) => c.telefone ?? '-' },
    {
      key: 'actions',
      header: 'Ações',
      render: (c: Cliente) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Editar</Button>
          <Button size="sm" variant="danger" onClick={() => remove(c.id)}>Excluir</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes da empresa"
        actions={<Button onClick={openCreate}>Novo Cliente</Button>}
      />

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome ou CPF/CNPJ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="Nenhum cliente encontrado"
        />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editCliente ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            required
          />
          <Select
            label="Tipo"
            options={[
              { value: 'fisica', label: 'Pessoa Física' },
              { value: 'juridica', label: 'Pessoa Jurídica' },
            ]}
            value={form.tipo}
            onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'fisica' | 'juridica' }))}
          />
          <Input
            label="CPF/CNPJ"
            value={form.cpf_cnpj}
            onChange={e => setForm(f => ({ ...f, cpf_cnpj: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
