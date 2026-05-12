'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useEtapas, type EtapaConfig } from '@/hooks/useEtapas'
import { useUsers, type Usuario, type CreateUsuarioPayload, type UpdateUsuarioPayload } from '@/hooks/useUsers'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('etapas')

  return (
    <div>
      <PageHeader title="Configurações" description="Configure o sistema" />
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'empresa',      label: 'Dados da Empresa'   },
          { id: 'etapas',       label: 'Etapas de Produção' },
          { id: 'usuarios',     label: 'Usuários'           },
          { id: 'erp',          label: 'Integração ERP'     },
          { id: 'notificacoes', label: 'Notificações'       },
        ]}
      />
      {activeTab === 'empresa'      && <EmpresaConfig />}
      {activeTab === 'etapas'       && <EtapasConfig />}
      {activeTab === 'usuarios'     && <UsuariosConfig />}
      {activeTab === 'erp'          && <ERPConfig />}
      {activeTab === 'notificacoes' && <NotificacoesConfig />}
    </div>
  )
}

// ---- Dados da Empresa ----

function EmpresaConfig() {
  const { empresa, loading, load, save } = useEmpresa()
  const [form,    setForm]    = useState({ nome: '', cnpj: '', email: '', telefone: '' })
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (empresa) {
      setForm({
        nome:     empresa.nome     ?? '',
        cnpj:     empresa.cnpj     ?? '',
        email:    empresa.email    ?? '',
        telefone: empresa.telefone ?? '',
      })
    }
  }, [empresa])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      await save({
        nome:     form.nome,
        cnpj:     form.cnpj     || undefined,
        email:    form.email    || undefined,
        telefone: form.telefone || undefined,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Card className="p-6"><div className="flex justify-center p-8"><Spinner /></div></Card>

  return (
    <Card className="p-6 max-w-xl">
      <h3 className="font-semibold text-gray-900 mb-5">Dados da Empresa</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome da empresa *"
          value={form.nome}
          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
          required
        />
        <Input
          label="CNPJ"
          value={form.cnpj}
          placeholder="00.000.000/0000-00"
          onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
        />
        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
        <Input
          label="Telefone"
          value={form.telefone}
          placeholder="(00) 00000-0000"
          onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            Dados salvos com sucesso.
          </p>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

// ---- Etapas ----

const ETAPA_EMPTY = { nome: '', ordem: '', percentual_tempo: '' }

function EtapasConfig() {
  const { etapas, loading, list, create, update, remove } = useEtapas()
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState<EtapaConfig | null>(null)
  const [form,      setForm]      = useState(ETAPA_EMPTY)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => { list() }, [list])

  function openCreate() { setEditing(null); setForm(ETAPA_EMPTY); setShowModal(true) }
  function openEdit(e: EtapaConfig) {
    setEditing(e)
    setForm({ nome: e.nome, ordem: String(e.ordem), percentual_tempo: String(e.percentual_tempo) })
    setShowModal(true)
  }
  function closeModal() { setShowModal(false); setEditing(null); setForm(ETAPA_EMPTY) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { nome: form.nome, ordem: Number(form.ordem), percentual_tempo: Number(form.percentual_tempo) }
      editing ? await update(editing.id, payload) : await create(payload)
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const total = etapas.reduce((sum, e) => sum + e.percentual_tempo, 0)
  const totalColor = total === 100 ? 'text-green-600' : total > 100 ? 'text-red-600' : 'text-yellow-600'

  const columns = [
    { key: 'ordem', header: 'Ordem' },
    { key: 'nome',  header: 'Nome'  },
    { key: 'percentual_tempo', header: '% Tempo', render: (e: EtapaConfig) => `${e.percentual_tempo}%` },
    { key: 'actions', header: 'Ações', render: (e: EtapaConfig) => (
      <div className="flex gap-2 justify-center">
        <Button size="sm" variant="outline" onClick={() => openEdit(e)}>Editar</Button>
        <Button size="sm" variant="danger"  onClick={() => remove(e.id)}>Remover</Button>
      </div>
    )},
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-sm font-medium ${totalColor}`}>
          Total: {total}% {total === 100 ? '✓' : total > 100 ? '(excede 100%)' : `(faltam ${100 - total}%)`}
        </span>
        <Button onClick={openCreate}>Nova Etapa</Button>
      </div>
      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : (
        <Table columns={columns} data={etapas} keyField="id" emptyMessage="Nenhuma etapa configurada" />
      )}
      <Modal isOpen={showModal} onClose={closeModal} title={editing ? 'Editar Etapa' : 'Nova Etapa de Produção'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome *"    value={form.nome}             onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}             required />
          <Input label="Ordem *"   value={form.ordem}    type="number" onChange={e => setForm(f => ({ ...f, ordem: e.target.value }))}    required />
          <Input label="% Tempo *" value={form.percentual_tempo} type="number" onChange={e => setForm(f => ({ ...f, percentual_tempo: e.target.value }))} required />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}

// ---- Usuários ----

const PERFIL_LABEL: Record<string, string> = {
  admin:    'Administrador',
  vendedor: 'Vendedor',
  producao: 'Produção',
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange'

const PERFIL_VARIANT: Record<string, BadgeVariant> = {
  admin:    'info',
  vendedor: 'success',
  producao: 'orange',
}

const PERFIL_OPTIONS = [
  { value: 'vendedor', label: 'Vendedor'       },
  { value: 'producao', label: 'Produção'        },
  { value: 'admin',    label: 'Administrador'   },
]

const USER_EMPTY = { nome: '', email: '', senha: '', perfil: 'vendedor' as 'admin' | 'vendedor' | 'producao' }

function UsuariosConfig() {
  const { usuarios, loading, list, create, update, remove } = useUsers()
  const [showModal,  setShowModal]  = useState(false)
  const [editing,    setEditing]    = useState<Usuario | null>(null)
  const [form,       setForm]       = useState(USER_EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [confirmDel, setConfirmDel] = useState<Usuario | null>(null)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => { list() }, [list])

  function openCreate() {
    setEditing(null)
    setForm(USER_EMPTY)
    setError('')
    setShowModal(true)
  }

  function openEdit(u: Usuario) {
    setEditing(u)
    setForm({ nome: u.nome, email: u.email, senha: '', perfil: u.perfil })
    setError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setForm(USER_EMPTY)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editing) {
        await update(editing.id, { nome: form.nome, perfil: form.perfil as UpdateUsuarioPayload['perfil'] })
      } else {
        await create({ nome: form.nome, email: form.email, senha: form.senha, perfil: form.perfil as CreateUsuarioPayload['perfil'] })
      }
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDel) return
    setDeleting(true)
    try {
      await remove(confirmDel.id)
      setConfirmDel(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover usuário')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'nome',
      header: 'Nome',
      render: (u: Usuario) => (
        <div>
          <p className="font-medium text-gray-900">{u.nome}</p>
          <p className="text-xs text-gray-400">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'perfil',
      header: 'Perfil',
      render: (u: Usuario) => (
        <div className="flex justify-center">
          <Badge variant={PERFIL_VARIANT[u.perfil] ?? 'default'}>
            {PERFIL_LABEL[u.perfil] ?? u.perfil}
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (u: Usuario) => (
        <div className="flex gap-2 justify-center">
          <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Editar</Button>
          <Button size="sm" variant="danger"  onClick={() => setConfirmDel(u)}>Remover</Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">
              {usuarios.length} {usuarios.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
            </p>
          </div>
          <Button onClick={openCreate}>+ Novo Usuário</Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : (
          <Table
            columns={columns}
            data={usuarios}
            keyField="id"
            emptyMessage="Nenhum usuário cadastrado"
          />
        )}
      </Card>

      {/* Modal criar / editar */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            required
          />

          {!editing && (
            <>
              <Input
                label="E-mail *"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                label="Senha * (mín. 6 caracteres)"
                type="password"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                required
                minLength={6}
              />
            </>
          )}

          {editing && (
            <div className="p-3 bg-gray-50 rounded text-sm text-gray-500">
              E-mail: <span className="font-medium text-gray-700">{editing.email}</span>
            </div>
          )}

          <Select
            label="Perfil de acesso *"
            options={PERFIL_OPTIONS}
            value={form.perfil}
            onChange={e => setForm(f => ({ ...f, perfil: e.target.value as typeof form.perfil }))}
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar usuário'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmação de remoção */}
      <Modal
        isOpen={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Remover usuário"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Tem certeza que deseja remover o usuário{' '}
            <strong>{confirmDel?.nome}</strong> ({confirmDel?.email})?
          </p>
          <p className="text-xs text-gray-500">
            O acesso ao sistema será revogado imediatamente.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Removendo...' : 'Confirmar remoção'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ---- ERP / Notificações ----

function ERPConfig() {
  return (
    <Card className="p-6">
      <p className="text-gray-500 text-sm">Configuração de integração ERP será implementada na Fase 8.</p>
    </Card>
  )
}

function NotificacoesConfig() {
  return (
    <Card className="p-6">
      <p className="text-gray-500 text-sm">Configuração de notificações será implementada em fases futuras.</p>
    </Card>
  )
}
