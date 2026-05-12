'use client'

import { useState } from 'react'
import { useWizard } from '../WizardProvider'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Spinner } from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import type { Personalizacao } from '@/types'

type NovaPersonalizacao = Omit<Personalizacao, 'id' | 'canvas_x' | 'canvas_y' | 'canvas_escala' | 'canvas_rotacao' | 'local_id'>

const FONTES = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Trebuchet MS']

const tipoLabel: Record<string, string> = {
  serigrafia: 'Serigrafia', DTF: 'DTF', bordado: 'Bordado', sublimacao: 'Sublimação',
}

const LOCAIS: Record<string, { lado: 'frente' | 'verso'; opcoes: string[] }> = {
  'Bolso':         { lado: 'frente', opcoes: ['Bolso acima', 'Bolso centro', 'Bolso baixo', 'Sem bolso'] },
  'Frente':        { lado: 'frente', opcoes: ['Local do bolso direito', 'Local do bolso esquerdo', 'Peito', 'Ombro direito', 'Ombro esquerdo', 'Estômago'] },
  'Costas':        { lado: 'verso',  opcoes: ['Etiqueta', 'Padrão', 'Barra'] },
  'Personalizada': { lado: 'frente', opcoes: ['Numerada', 'Nomeada'] },
  'Barra':         { lado: 'frente', opcoes: ['Central', 'Lado direito', 'Lado esquerdo', 'Etiqueta'] },
  'Mangas':        { lado: 'frente', opcoes: ['Direita', 'Esquerda'] },
}

const initialNova = (): NovaPersonalizacao => ({
  tipo: 'serigrafia',
  tipo_conteudo: 'imagem',
  lado: 'frente',
  cores: [],
  url_imagem: '',
  texto_conteudo: '',
  texto_fonte: 'Arial',
  observacao: '',
})

export function StepPersonalizacao() {
  const { state, addPersonalizacao, removePersonalizacao, updateItem, setCurrentStep } = useWizard()
  const [nova, setNova] = useState<NovaPersonalizacao>(initialNova())
  const [localGrupo, setLocalGrupo] = useState('')
  const [localOpcao, setLocalOpcao] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [addError, setAddError] = useState('')

  const artePronta = state.item.arte_pronta ?? false

  async function handleFileSelect(file: File) {
    setUploadError('')
    setUploading(true)

    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
      const path = `${user?.id ?? 'anon'}/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage.from('artes').upload(path, file)
      if (error) throw new Error(error.message)

      const { data: { publicUrl } } = supabase.storage.from('artes').getPublicUrl(path)

      if (artePronta) {
        updateItem({ arte_pronta_url: publicUrl })
      } else {
        setNova(n => ({ ...n, url_imagem: publicUrl }))
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao fazer upload')
      setPreviewUrl('')
      if (artePronta) {
        updateItem({ arte_pronta_url: '' })
      } else {
        setNova(n => ({ ...n, url_imagem: '' }))
      }
    } finally {
      setUploading(false)
    }
  }

  function handleRemoveImage() {
    setPreviewUrl('')
    setUploadError('')
    if (artePronta) {
      updateItem({ arte_pronta_url: '' })
    } else {
      setNova(n => ({ ...n, url_imagem: '' }))
    }
  }

  function toggleArtePronta() {
    const novoValor = !artePronta
    updateItem({ arte_pronta: novoValor, arte_pronta_url: '' })
    setPreviewUrl('')
    setUploadError('')
    setAddError('')
  }

  function handleLocalGrupoChange(grupo: string) {
    setLocalGrupo(grupo)
    setLocalOpcao('')
    const lado = LOCAIS[grupo]?.lado ?? 'frente'
    setNova(n => ({ ...n, lado }))
  }

  function adicionar() {
    setAddError('')

    if (!localGrupo) {
      setAddError('Selecione o local da personalização.')
      return
    }
    if (LOCAIS[localGrupo]?.opcoes.length && !localOpcao) {
      setAddError('Selecione o detalhe do local.')
      return
    }

    if (artePronta) {
      if (nova.tipo_conteudo === 'imagem' && !state.item.arte_pronta_url) {
        setAddError('Faça o upload da arte antes de adicionar.')
        return
      }
    } else {
      if (nova.tipo_conteudo === 'imagem' && !nova.url_imagem) {
        setAddError('Faça o upload da arte antes de adicionar.')
        return
      }
    }

    if (nova.tipo_conteudo === 'texto' && !nova.texto_conteudo?.trim()) {
      setAddError('Digite o texto da personalização.')
      return
    }

    const local_id = localOpcao ? `${localGrupo} - ${localOpcao}` : localGrupo

    // Em modo Arte Pronta com imagem, reutiliza a arte compartilhada
    const urlImagem = (artePronta && nova.tipo_conteudo === 'imagem')
      ? (state.item.arte_pronta_url ?? '')
      : nova.url_imagem

    addPersonalizacao({
      id: crypto.randomUUID(),
      ...nova,
      url_imagem: urlImagem,
      sublimacao_tipo: nova.tipo === 'sublimacao' ? (nova.sublimacao_tipo ?? 'total') : undefined,
      local_id,
      canvas_x: 0.5,
      canvas_y: 0.3,
      canvas_escala: 1,
      canvas_rotacao: 0,
    })

    setNova(initialNova())
    setLocalGrupo('')
    setLocalOpcao('')
    setAddError('')

    // Em Arte Pronta não limpa o preview da arte compartilhada
    if (!artePronta) {
      setPreviewUrl('')
      setUploadError('')
    }
  }

  function descricaoPersonalizacao(p: Personalizacao) {
    if (p.tipo_conteudo === 'texto' && p.texto_conteudo) return `"${p.texto_conteudo.slice(0, 30)}${p.texto_conteudo.length > 30 ? '…' : ''}"`
    if (p.tipo_conteudo === 'imagem' && p.url_imagem) return 'Arte enviada'
    return p.tipo_conteudo
  }

  function renderListaPersonalizacoes() {
    if (state.personalizacoes.length === 0) return null
    return (
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Personalizações adicionadas ({state.personalizacoes.length})
        </p>
        <div className="space-y-2">
          {state.personalizacoes.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                {p.url_imagem ? (
                  <img
                    src={p.url_imagem}
                    alt="arte"
                    className="w-20 h-20 object-contain rounded-lg border bg-white shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg border bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-2xl select-none">T</span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="info">
                      {p.tipo === 'sublimacao' && p.sublimacao_tipo
                        ? `Sublimação ${p.sublimacao_tipo === 'total' ? 'Total' : 'Parcial'}`
                        : (tipoLabel[p.tipo] ?? p.tipo)}
                    </Badge>
                    <Badge variant="default">{p.local_id ?? p.lado}</Badge>
                  </div>
                  <span className="text-xs text-gray-500">{descricaoPersonalizacao(p)}</span>
                  {p.observacao && (
                    <span className="text-xs text-gray-400 italic">Obs: {p.observacao}</span>
                  )}
                </div>
              </div>
              <Button size="sm" variant="danger" onClick={() => removePersonalizacao(p.id)}>Remover</Button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderFormulario(isArtePronta: boolean) {
    return (
      <div className={`p-4 border-2 border-dashed rounded-lg space-y-4 ${isArtePronta ? 'border-amber-300' : 'border-gray-300'}`}>
        <div>
          <h3 className={`font-medium ${isArtePronta ? 'text-amber-700' : 'text-gray-700'}`}>Nova Personalização</h3>
          {!isArtePronta && state.personalizacoes.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">Para alterar uma imagem existente, remova-a acima e adicione novamente aqui.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo"
            options={[
              { value: 'serigrafia', label: 'Serigrafia' },
              { value: 'DTF', label: 'DTF' },
              { value: 'bordado', label: 'Bordado' },
              { value: 'sublimacao', label: 'Sublimação' },
            ]}
            value={nova.tipo}
            onChange={e => {
              const t = e.target.value as Personalizacao['tipo']
              setNova(n => ({ ...n, tipo: t, sublimacao_tipo: t === 'sublimacao' ? (n.sublimacao_tipo ?? 'total') : undefined }))
            }}
          />
          {nova.tipo === 'sublimacao' && (
            <Select
              label="Sublimação"
              options={[
                { value: 'total',   label: 'Total' },
                { value: 'parcial', label: 'Parcial' },
              ]}
              value={nova.sublimacao_tipo ?? 'total'}
              onChange={e => setNova(n => ({ ...n, sublimacao_tipo: e.target.value as 'total' | 'parcial' }))}
            />
          )}
          <Select
            label="Conteúdo"
            options={[
              { value: 'imagem', label: 'Imagem / Arte' },
              { value: 'texto', label: 'Texto livre' },
            ]}
            value={nova.tipo_conteudo}
            onChange={e => {
              setNova(n => ({ ...n, tipo_conteudo: e.target.value as 'imagem' | 'texto', url_imagem: '', texto_conteudo: '' }))
              if (!isArtePronta) setPreviewUrl('')
              setUploadError('')
              setAddError('')
            }}
          />
          <Select
            label="Local da Personalização"
            options={[
              { value: '', label: 'Selecione...' },
              ...Object.keys(LOCAIS).map(g => ({ value: g, label: g })),
            ]}
            value={localGrupo}
            onChange={e => handleLocalGrupoChange(e.target.value)}
          />
          {localGrupo && (
            <Select
              label="Detalhe do Local"
              options={[
                { value: '', label: 'Selecione...' },
                ...(LOCAIS[localGrupo]?.opcoes ?? []).map(o => ({ value: o, label: o })),
              ]}
              value={localOpcao}
              onChange={e => setLocalOpcao(e.target.value)}
            />
          )}
        </div>

        {/* Upload de arte — só no modo normal */}
        {!isArtePronta && nova.tipo_conteudo === 'imagem' && (
          <div className="space-y-2">
            <ImageUpload
              label="Arte (PNG, JPG ou SVG)"
              previewUrl={previewUrl}
              onFileSelect={handleFileSelect}
              onRemove={handleRemoveImage}
              uploading={uploading}
            />
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner />
                <span>Enviando arquivo…</span>
              </div>
            )}
            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          </div>
        )}

        {/* Aviso quando arte pronta ainda não foi enviada */}
        {isArtePronta && nova.tipo_conteudo === 'imagem' && !state.item.arte_pronta_url && (
          <p className="text-xs text-amber-600">Faça o upload da arte acima antes de adicionar.</p>
        )}

        {/* Campo de texto */}
        {nova.tipo_conteudo === 'texto' && (
          <div className="space-y-3">
            <Input
              label="Texto da personalização"
              placeholder="Ex: Nome do time, frase, número…"
              value={nova.texto_conteudo ?? ''}
              onChange={e => setNova(n => ({ ...n, texto_conteudo: e.target.value }))}
            />
            <Select
              label="Fonte"
              options={FONTES.map(f => ({ value: f, label: f }))}
              value={nova.texto_fonte ?? 'Arial'}
              onChange={e => setNova(n => ({ ...n, texto_fonte: e.target.value }))}
            />
            {nova.texto_conteudo && (
              <div className="p-3 bg-gray-50 rounded border text-center text-sm text-gray-700" style={{ fontFamily: nova.texto_fonte }}>
                {nova.texto_conteudo}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Observação da personalização (opcional)</label>
          <textarea
            rows={2}
            placeholder="Ex: cor do texto, posição exata, tamanho…"
            value={nova.observacao ?? ''}
            onChange={e => setNova(n => ({ ...n, observacao: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
          />
        </div>

        {addError && <p className="text-xs text-red-500">{addError}</p>}

        <Button
          onClick={adicionar}
          disabled={uploading || (isArtePronta && nova.tipo_conteudo === 'imagem' && !state.item.arte_pronta_url)}
        >
          + Adicionar Personalização
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Personalizações</h2>

        <button
          type="button"
          onClick={toggleArtePronta}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
            artePronta
              ? 'bg-amber-50 border-amber-400 text-amber-700'
              : 'bg-white border-gray-300 text-gray-600 hover:border-amber-300'
          }`}
        >
          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
            artePronta ? 'bg-amber-400 border-amber-400' : 'border-gray-400'
          }`}>
            {artePronta && <span className="text-white text-[10px] leading-none">✓</span>}
          </span>
          Arte Pronta
        </button>
      </div>

      {artePronta ? (
        <div className="space-y-6">
          {/* Upload compartilhado — inserido uma única vez */}
          <div className="p-4 border-2 border-amber-200 bg-amber-50 rounded-lg space-y-4">
            <p className="text-sm text-amber-700 font-medium">
              Faça o upload da arte finalizada uma única vez. Ela será usada em todas as personalizações adicionadas abaixo.
            </p>
            <ImageUpload
              label="Arte Pronta (PNG, JPG ou SVG)"
              previewUrl={previewUrl || state.item.arte_pronta_url || undefined}
              onFileSelect={handleFileSelect}
              onRemove={handleRemoveImage}
              uploading={uploading}
            />
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Spinner />
                <span>Enviando arquivo…</span>
              </div>
            )}
            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            {state.item.arte_pronta_url && (
              <p className="text-xs text-green-600 font-medium">✓ Arte enviada com sucesso</p>
            )}
          </div>

          {renderListaPersonalizacoes()}
          {renderFormulario(true)}
        </div>
      ) : (
        <>
          {renderListaPersonalizacoes()}
          {renderFormulario(false)}
        </>
      )}

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={() => setCurrentStep(5)}>← Anterior</Button>
        <Button
          onClick={() => setCurrentStep(artePronta ? 8 : 7)}
          disabled={artePronta && (!state.item.arte_pronta_url || state.personalizacoes.length === 0)}
        >
          Próximo →
        </Button>
      </div>
    </div>
  )
}
