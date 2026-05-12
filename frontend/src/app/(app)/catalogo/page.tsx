'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { useProdutos, type Produto } from '@/hooks/useProdutos'
import { useModelos, type Modelo } from '@/hooks/useModelos'
import { useMateriasPrimas, type MateriaPrima, type CreateMateriaPrimaPayload } from '@/hooks/useMateriasPrimas'
import { useCatalogoOpcoes, type CategoriaOpcao, type CatalogoOpcao } from '@/hooks/useCatalogoOpcoes'
import { useTamanhos, type Tamanho, type CreateTamanhoPayload } from '@/hooks/useTamanhos'
import { useFornecedores, type Fornecedor, type CreateFornecedorPayload } from '@/hooks/useFornecedores'
import { useUpload } from '@/hooks/useUpload'

const CATEGORIAS: { id: CategoriaOpcao; label: string }[] = [
  { id: 'modelo',     label: 'Modelo'     },
  { id: 'gola',       label: 'Gola'       },
  { id: 'mangas',     label: 'Mangas'     },
  { id: 'barras',     label: 'Barras'     },
  { id: 'recortes',   label: 'Recortes'   },
  { id: 'bolsos',     label: 'Bolsos'     },
  { id: 'acabamento', label: 'Acabamento' },
]

const BUCKET_PRODUTOS = 'imagens-produtos'
const BUCKET_MODELOS = 'imagens-modelos'

export default function CatalogoPage() {
  const [activeTab, setActiveTab] = useState('produtos')

  return (
    <div>
      <PageHeader title="Catálogo" description="Gerencie produtos, modelos e matérias-primas" />
      <Tabs
        tabs={[
          { id: 'produtos',        label: 'Produtos'         },
          { id: 'modelos',         label: 'Opções de Modelo' },
          { id: 'materias-primas', label: 'Matérias-Primas'  },
          { id: 'cores',           label: 'Cores'            },
          { id: 'tamanhos',        label: 'Tamanhos'         },
          { id: 'fornecedores',    label: 'Fornecedores'     },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === 'produtos'        && <ProdutosTab />}
      {activeTab === 'modelos'         && <ModelosTab />}
      {activeTab === 'materias-primas' && <MateriasPrimasTab />}
      {activeTab === 'cores'           && <CoresTab />}
      {activeTab === 'tamanhos'        && <TamanhosTab />}
      {activeTab === 'fornecedores'    && <FornecedoresTab />}
    </div>
  )
}

// ─── Produtos ────────────────────────────────────────────────────────────────

function ProdutosTab() {
  const { produtos, loading, list, create, update, remove } = useProdutos()
  const { upload, removeFile } = useUpload()
  const [search, setSearch]             = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [editing, setEditing]           = useState<Produto | null>(null)
  const [form, setForm]                 = useState({ nome: '', descricao: '', consumo_por_unidade: '', unidade_consumo: 'kg' as 'kg' | 'm' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl]     = useState<string | undefined>()
  const [saving, setSaving]             = useState(false)
  const [modelosProduto, setModelosProduto] = useState<Produto | null>(null)

  useEffect(() => { list() }, [list])

  const filtered = produtos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditing(null)
    setForm({ nome: '', descricao: '', consumo_por_unidade: '', unidade_consumo: 'kg' })
    setSelectedFile(null)
    setPreviewUrl(undefined)
    setShowModal(true)
  }

  function openEdit(p: Produto) {
    setEditing(p)
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? '',
      consumo_por_unidade: p.consumo_por_unidade != null ? String(p.consumo_por_unidade) : '',
      unidade_consumo: p.unidade_consumo ?? 'kg',
    })
    setSelectedFile(null)
    setPreviewUrl(p.url_imagem)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setSelectedFile(null)
    setPreviewUrl(undefined)
  }

  function handleFileSelect(file: File) {
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleRemoveImage() {
    setSelectedFile(null)
    setPreviewUrl(undefined)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let url_imagem: string | undefined

      if (selectedFile) {
        if (editing?.url_imagem) {
          await removeFile(BUCKET_PRODUTOS, editing.url_imagem).catch(() => {})
        }
        url_imagem = await upload(selectedFile, BUCKET_PRODUTOS)
      } else if (previewUrl) {
        url_imagem = editing?.url_imagem
      } else if (!previewUrl && editing?.url_imagem) {
        await removeFile(BUCKET_PRODUTOS, editing.url_imagem).catch(() => {})
        url_imagem = undefined
      }

      const consumo = form.consumo_por_unidade !== '' ? parseFloat(form.consumo_por_unidade) : undefined
      const payload = {
        nome: form.nome,
        descricao: form.descricao || undefined,
        url_imagem,
        ...(editing && consumo != null ? { consumo_por_unidade: consumo, unidade_consumo: form.unidade_consumo } : {}),
      }

      if (editing) {
        await update(editing.id, payload)
      } else {
        await create(payload)
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Input
          placeholder="Buscar produtos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openCreate}>Novo Produto</Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-gray-500">Nenhum produto cadastrado</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
              <div className="h-44 bg-gray-50 flex items-center justify-center border-b">
                {p.url_imagem ? (
                  <img src={p.url_imagem} alt={p.nome} className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1 flex-1">
                <p className="font-semibold text-gray-900 truncate">{p.nome}</p>
                {p.descricao && (
                  <p className="text-xs text-gray-500 line-clamp-2">{p.descricao}</p>
                )}
                <div className="flex gap-2 mt-auto pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="flex-1">
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setModelosProduto(p)} className="flex-1">
                    Modelos
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(p.id)}>✕</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal} title={editing ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            required
          />
          <Input
            label="Descrição"
            value={form.descricao}
            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
          />
          <ImageUpload
            label="Foto do Produto"
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
            onRemove={handleRemoveImage}
            uploading={saving}
          />
          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consumo por unidade
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="Ex: 0.25"
                  value={form.consumo_por_unidade}
                  onChange={e => setForm(f => ({ ...f, consumo_por_unidade: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {(['kg', 'm'] as const).map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, unidade_consumo: u }))}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        form.unidade_consumo === u
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Quantidade de matéria-prima consumida por peça produzida
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>

      {modelosProduto && (
        <ModelosProdutoModal
          produto={modelosProduto}
          onClose={() => setModelosProduto(null)}
        />
      )}
    </div>
  )
}

// ─── Modelos por Produto ──────────────────────────────────────────────────────

type ModeloFormData = {
  nome: string
  tipo: string
  gola: string
  mangas: string
  barras: string
  recortes: string
  bolsos: string
  acabamento: string
}

const EMPTY_MODELO: ModeloFormData = {
  nome: '', tipo: '', gola: '', mangas: '',
  barras: '', recortes: '', bolsos: '', acabamento: '',
}

function ModelosProdutoModal({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const { modelos, loading, list, create, update, remove } = useModelos()
  const { upload, removeFile } = useUpload()

  const [showForm, setShowForm]         = useState(false)
  const [editingModelo, setEditingModelo] = useState<Modelo | null>(null)
  const [form, setForm]                 = useState<ModeloFormData>({ ...EMPTY_MODELO })
  const [frenteFile, setFrenteFile]     = useState<File | null>(null)
  const [versoFile, setVersoFile]       = useState<File | null>(null)
  const [frentePreview, setFrentePreview] = useState<string | undefined>()
  const [versoPreview, setVersoPreview]   = useState<string | undefined>()
  const [saving, setSaving]             = useState(false)

  useEffect(() => { list(produto.id) }, [produto.id, list])

  function openCreate() {
    setEditingModelo(null)
    setForm({ ...EMPTY_MODELO })
    setFrenteFile(null); setVersoFile(null)
    setFrentePreview(undefined); setVersoPreview(undefined)
    setShowForm(true)
  }

  function openEdit(m: Modelo) {
    setEditingModelo(m)
    setForm({
      nome:       m.nome,
      tipo:       m.tipo       ?? '',
      gola:       m.gola       ?? '',
      mangas:     m.mangas     ?? '',
      barras:     m.barras     ?? '',
      recortes:   m.recortes   ?? '',
      bolsos:     m.bolsos     ?? '',
      acabamento: m.acabamento ?? '',
    })
    setFrenteFile(null); setVersoFile(null)
    setFrentePreview(m.url_imagem_frente)
    setVersoPreview(m.url_imagem_verso)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingModelo(null)
  }

  const resolveImageUrl = useCallback(async (
    newFile: File | null,
    currentPreview: string | undefined,
    existingUrl: string | undefined,
  ): Promise<string | undefined> => {
    if (newFile) {
      if (existingUrl) await removeFile(BUCKET_MODELOS, existingUrl).catch(() => {})
      return upload(newFile, BUCKET_MODELOS)
    }
    if (currentPreview) return existingUrl
    if (!currentPreview && existingUrl) {
      await removeFile(BUCKET_MODELOS, existingUrl).catch(() => {})
      return undefined
    }
    return undefined
  }, [upload, removeFile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const [url_imagem_frente, url_imagem_verso] = await Promise.all([
        resolveImageUrl(frenteFile, frentePreview, editingModelo?.url_imagem_frente),
        resolveImageUrl(versoFile,  versoPreview,  editingModelo?.url_imagem_verso),
      ])

      const payload = {
        nome:       form.nome,
        tipo:       form.tipo       || undefined,
        gola:       form.gola       || undefined,
        mangas:     form.mangas     || undefined,
        barras:     form.barras     || undefined,
        recortes:   form.recortes   || undefined,
        bolsos:     form.bolsos     || undefined,
        acabamento: form.acabamento || undefined,
        url_imagem_frente,
        url_imagem_verso,
      }

      if (editingModelo) {
        await update(editingModelo.id, payload)
      } else {
        await create({ produto_id: produto.id, ...payload })
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const setField = (key: keyof ModeloFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <Modal isOpen onClose={onClose} title={`Modelos — ${produto.nome}`} size="lg">
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              {editingModelo ? 'Editar Modelo' : 'Novo Modelo'}
            </h3>
            <button type="button" onClick={closeForm} className="text-sm text-gray-500 hover:text-gray-700">
              ← Voltar
            </button>
          </div>

          <Input
            label="Nome do modelo *"
            value={form.nome}
            onChange={setField('nome')}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIAS.map(cat => (
              <Input
                key={cat.id}
                label={cat.label}
                value={form[cat.id as keyof ModeloFormData]}
                onChange={setField(cat.id as keyof ModeloFormData)}
                placeholder={`Ex: ${cat.label}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ImageUpload
              label="Imagem Frente"
              previewUrl={frentePreview}
              onFileSelect={f => { setFrenteFile(f); setFrentePreview(URL.createObjectURL(f)) }}
              onRemove={() => { setFrenteFile(null); setFrentePreview(undefined) }}
              uploading={saving}
            />
            <ImageUpload
              label="Imagem Verso"
              previewUrl={versoPreview}
              onFileSelect={f => { setVersoFile(f); setVersoPreview(URL.createObjectURL(f)) }}
              onRemove={() => { setVersoFile(null); setVersoPreview(undefined) }}
              uploading={saving}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {loading ? 'Carregando...' : `${modelos.length} modelo(s)`}
            </p>
            <Button size="sm" onClick={openCreate}>+ Novo Modelo</Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : modelos.length === 0 ? (
            <p className="text-center py-8 text-gray-400">
              Nenhum modelo cadastrado para este produto
            </p>
          ) : (
            <div className="space-y-2">
              {modelos.map(m => (
                <div key={m.id} className="border rounded-lg p-3 flex items-center gap-3">
                  <div className="flex gap-2 shrink-0">
                    <Thumbnail url={m.url_imagem_frente} label="Frente" />
                    <Thumbnail url={m.url_imagem_verso}  label="Verso"  />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{m.nome}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {[
                        m.tipo,
                        m.gola       && `Gola: ${m.gola}`,
                        m.mangas     && `Mangas: ${m.mangas}`,
                        m.acabamento && `Acab.: ${m.acabamento}`,
                      ].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEdit(m)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => remove(m.id)}>✕</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function Thumbnail({ url, label }: { url?: string; label: string }) {
  return (
    <div className="w-14 h-14 bg-gray-100 rounded border overflow-hidden flex items-center justify-center shrink-0">
      {url ? (
        <img src={url} alt={label} className="w-full h-full object-contain" />
      ) : (
        <span className="text-gray-300 text-[10px] text-center leading-tight px-1">{label}</span>
      )}
    </div>
  )
}

// ─── Opções de Modelo (sub-abas) ─────────────────────────────────────────────

function ModelosTab() {
  const [subTab, setSubTab] = useState<CategoriaOpcao>('modelo')

  return (
    <div>
      <div className="flex gap-1 mb-4 border-b overflow-x-auto">
        {CATEGORIAS.map(c => (
          <button
            key={c.id}
            onClick={() => setSubTab(c.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              subTab === c.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <OpcoesCrud
        categoria={subTab}
        label={CATEGORIAS.find(c => c.id === subTab)?.label ?? ''}
      />
    </div>
  )
}

const CATEGORIAS_COM_PROPORCAO: CategoriaOpcao[] = ['gola', 'mangas', 'barras', 'recortes', 'bolsos', 'acabamento']

function fmtProporcao(o: CatalogoOpcao): string {
  if (!o.proporcao || !o.tipo_proporcao) return '—'
  if (o.tipo_proporcao === 'unidade') return `${o.proporcao} un/peça`
  return `${o.proporcao}% consumo`
}

function OpcoesCrud({ categoria, label }: { categoria: CategoriaOpcao; label: string }) {
  const { opcoes, loading, list, create, update, remove } = useCatalogoOpcoes(categoria)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<CatalogoOpcao | null>(null)
  const [form, setForm]           = useState({
    nome: '', descricao: '', ordem: '0', corHex: '#ffffff',
    proporcao: '', tipoProporcao: '' as '' | 'unidade' | 'percentual',
  })
  const [saving, setSaving]       = useState(false)

  const temProporcao = CATEGORIAS_COM_PROPORCAO.includes(categoria)

  useEffect(() => { list() }, [list])

  function openCreate() {
    setEditing(null)
    setForm({ nome: '', descricao: '', ordem: String(opcoes.length + 1), corHex: '#ffffff', proporcao: '', tipoProporcao: '' })
    setShowModal(true)
  }
  function openEdit(o: CatalogoOpcao) {
    setEditing(o)
    setForm({
      nome: o.nome, descricao: o.descricao ?? '', ordem: String(o.ordem), corHex: o.cor_hex ?? '#ffffff',
      proporcao: o.proporcao != null ? String(o.proporcao) : '',
      tipoProporcao: (o.tipo_proporcao as '' | 'unidade' | 'percentual') ?? '',
    })
    setShowModal(true)
  }
  function closeModal() { setShowModal(false); setEditing(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const ordem       = Number(form.ordem) || 0
      const corHex      = categoria === 'cor' ? form.corHex : undefined
      const proporcao   = temProporcao && form.proporcao !== '' ? Number(form.proporcao) : undefined
      const tipoProp    = temProporcao && form.tipoProporcao ? form.tipoProporcao : undefined
      if (editing) {
        await update(editing.id, form.nome, form.descricao, ordem, corHex, proporcao, tipoProp)
      } else {
        await create(form.nome, form.descricao, ordem, corHex, proporcao, tipoProp)
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'ordem', header: 'Ordem', render: (o: CatalogoOpcao) => String(o.ordem) },
    ...(categoria === 'cor' ? [{
      key: 'cor_hex',
      header: 'Cor',
      render: (o: CatalogoOpcao) => o.cor_hex ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border border-gray-300 flex-shrink-0" style={{ backgroundColor: o.cor_hex }} />
          <span className="text-xs text-gray-500 font-mono">{o.cor_hex}</span>
        </div>
      ) : <span className="text-gray-400">—</span>,
    }] : []),
    { key: 'nome',      header: 'Nome' },
    { key: 'descricao', header: 'Descrição', render: (o: CatalogoOpcao) => o.descricao ?? '-' },
    ...(temProporcao ? [{
      key: 'proporcao',
      header: 'Proporção',
      render: (o: CatalogoOpcao) => {
        const txt = fmtProporcao(o)
        if (txt === '—') return <span className="text-gray-300">—</span>
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {txt}
          </span>
        )
      },
    }] : []),
    {
      key: 'actions', header: 'Ações',
      render: (o: CatalogoOpcao) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(o)}>Editar</Button>
          <Button size="sm" variant="danger"  onClick={() => remove(o.id)}>Excluir</Button>
        </div>
      ),
    },
  ]

  const filtered = opcoes.filter(o =>
    o.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Input
          placeholder={`Buscar ${label.toLowerCase()}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openCreate}>Nova opção de {label}</Button>
      </div>
      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage={`Nenhuma opção de ${label} cadastrada`}
        />
      )}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? `Editar ${label}` : `Nova opção de ${label}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            required
          />
          {categoria === 'cor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor (hex)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.corHex}
                  onChange={e => setForm(f => ({ ...f, corHex: e.target.value }))}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <span className="text-sm font-mono text-gray-600">{form.corHex}</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              rows={3}
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Descreva esta opção (opcional)"
            />
          </div>
          <Input
            label="Ordem"
            type="number"
            value={form.ordem}
            onChange={e => setForm(f => ({ ...f, ordem: e.target.value }))}
          />
          {temProporcao && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proporção por peça <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 1, 2, 5"
                  value={form.proporcao}
                  onChange={e => setForm(f => ({ ...f, proporcao: e.target.value }))}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <select
                  value={form.tipoProporcao}
                  onChange={e => setForm(f => ({ ...f, tipoProporcao: e.target.value as '' | 'unidade' | 'percentual' }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Nenhuma</option>
                  <option value="unidade">un/peça (conta em unidades)</option>
                  <option value="percentual">% do consumo de tecido</option>
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Ex: Punho = 2 un/peça · Manga raglan = 5% do consumo
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ─── Cores ────────────────────────────────────────────────────────────────────

function CoresTab() {
  return <OpcoesCrud categoria="cor" label="Cor" />
}

// ─── Matérias-Primas ──────────────────────────────────────────────────────────

const MP_EMPTY: CreateMateriaPrimaPayload = { nome: '', composicao: '' }

function MateriasPrimasTab() {
  const { materias, loading, list, create, update, remove } = useMateriasPrimas()
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<MateriaPrima | null>(null)
  const [form, setForm]           = useState<CreateMateriaPrimaPayload>({ ...MP_EMPTY })
  const [saving, setSaving]       = useState(false)

  useEffect(() => { list() }, [list])

  const filtered = materias.filter(m =>
    m.nome.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() { setEditing(null); setForm({ ...MP_EMPTY }); setShowModal(true) }
  function openEdit(m: MateriaPrima) {
    setEditing(m)
    setForm({ nome: m.nome, composicao: m.composicao ?? '' })
    setShowModal(true)
  }
  function closeModal() { setShowModal(false); setEditing(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: CreateMateriaPrimaPayload = {
        nome: form.nome,
        composicao: form.composicao || undefined,
      }
      if (editing) {
        await update(editing.id, payload)
      } else {
        await create(payload)
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'nome',      header: 'Nome'       },
    { key: 'composicao', header: 'Composição', render: (m: MateriaPrima) => m.composicao ?? '-' },
    {
      key: 'actions', header: 'Ações',
      render: (m: MateriaPrima) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(m)}>Editar</Button>
          <Button size="sm" variant="danger"  onClick={() => remove(m.id)}>Excluir</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Input
          placeholder="Buscar matérias-primas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openCreate}>Nova Matéria-Prima</Button>
      </div>
      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="Nenhuma matéria-prima cadastrada"
        />
      )}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            required
          />
          <Input
            label="Composição (ex: 100% algodão)"
            value={form.composicao ?? ''}
            onChange={e => setForm(f => ({ ...f, composicao: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ─── Tamanhos ─────────────────────────────────────────────────────────────────

const GRUPOS_TAMANHO = ['Feminino', 'Tradicional', 'Feminino Numeração', 'Masculino Numeração', 'Infantil']
const TAM_EMPTY: CreateTamanhoPayload = { grupo: GRUPOS_TAMANHO[0], nome: '', ordem: 0 }

function TamanhosTab() {
  const { tamanhos, loading, list, create, update, remove } = useTamanhos()
  const [grupoAtivo, setGrupoAtivo] = useState(GRUPOS_TAMANHO[0])
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<Tamanho | null>(null)
  const [form, setForm]             = useState<CreateTamanhoPayload>({ ...TAM_EMPTY })
  const [saving, setSaving]         = useState(false)

  useEffect(() => { list() }, [list])

  const doGrupo = tamanhos.filter(t => t.grupo === grupoAtivo)

  function openCreate() {
    setEditing(null)
    setForm({ ...TAM_EMPTY, grupo: grupoAtivo })
    setShowModal(true)
  }
  function openEdit(t: Tamanho) {
    setEditing(t)
    setForm({ grupo: t.grupo, nome: t.nome, ordem: t.ordem })
    setShowModal(true)
  }
  function closeModal() { setShowModal(false); setEditing(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await update(editing.id, form)
      } else {
        await create(form)
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'nome',  header: 'Tamanho' },
    { key: 'ordem', header: 'Ordem', render: (t: Tamanho) => t.ordem },
    {
      key: 'actions', header: 'Ações',
      render: (t: Tamanho) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(t)}>Editar</Button>
          <Button size="sm" variant="danger"  onClick={() => remove(t.id)}>Excluir</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {GRUPOS_TAMANHO.map(g => (
          <button
            key={g}
            onClick={() => setGrupoAtivo(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              grupoAtivo === g
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex justify-between mb-4">
        <p className="text-sm text-gray-500 self-center">
          {doGrupo.length} tamanho{doGrupo.length !== 1 ? 's' : ''} em <strong>{grupoAtivo}</strong>
        </p>
        <Button onClick={openCreate}>+ Novo Tamanho</Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : (
        <Table
          columns={columns}
          data={doGrupo}
          keyField="id"
          emptyMessage="Nenhum tamanho cadastrado neste grupo"
        />
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? 'Editar Tamanho' : 'Novo Tamanho'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
            <select
              value={form.grupo}
              onChange={e => setForm(f => ({ ...f, grupo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GRUPOS_TAMANHO.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <Input
            label="Tamanho *"
            placeholder="Ex: M, GG, 42, Baby Look…"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            required
          />
          <Input
            label="Ordem"
            type="number"
            value={form.ordem}
            onChange={e => setForm(f => ({ ...f, ordem: Number(e.target.value) }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ─── Fornecedores ─────────────────────────────────────────────────────────────

const FORN_EMPTY: CreateFornecedorPayload = { nome: '', contato: '', telefone: '', email: '' }

function FornecedoresTab() {
  const { fornecedores, loading, list, create, update, remove } = useFornecedores()
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Fornecedor | null>(null)
  const [form, setForm]           = useState<CreateFornecedorPayload>({ ...FORN_EMPTY })
  const [saving, setSaving]       = useState(false)

  useEffect(() => { list() }, [list])

  const filtered = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    (f.contato ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() { setEditing(null); setForm({ ...FORN_EMPTY }); setShowModal(true) }
  function openEdit(f: Fornecedor) {
    setEditing(f)
    setForm({ nome: f.nome, contato: f.contato ?? '', telefone: f.telefone ?? '', email: f.email ?? '' })
    setShowModal(true)
  }
  function closeModal() { setShowModal(false); setEditing(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: CreateFornecedorPayload = {
        nome:     form.nome,
        contato:  form.contato  || undefined,
        telefone: form.telefone || undefined,
        email:    form.email    || undefined,
      }
      if (editing) {
        await update(editing.id, payload)
      } else {
        await create(payload)
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'nome',     header: 'Nome'     },
    { key: 'contato',  header: 'Contato',  render: (f: Fornecedor) => f.contato  ?? '-' },
    { key: 'telefone', header: 'Telefone', render: (f: Fornecedor) => f.telefone ?? '-' },
    { key: 'email',    header: 'E-mail',   render: (f: Fornecedor) => f.email    ?? '-' },
    {
      key: 'actions', header: 'Ações',
      render: (f: Fornecedor) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(f)}>Editar</Button>
          <Button size="sm" variant="danger"  onClick={() => remove(f.id)}>Excluir</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Input
          placeholder="Buscar fornecedores..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openCreate}>Novo Fornecedor</Button>
      </div>
      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="Nenhum fornecedor cadastrado"
        />
      )}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            required
          />
          <Input
            label="Contato (nome da pessoa)"
            value={form.contato ?? ''}
            onChange={e => setForm(f => ({ ...f, contato: e.target.value }))}
          />
          <Input
            label="Telefone"
            value={form.telefone ?? ''}
            onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email ?? ''}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
