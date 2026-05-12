-- =============================================
-- ConfecçãoPRO — Migration 001: schema inicial
-- 15 tabelas + RLS + índices
-- =============================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- FUNDAÇÃO
-- =============================================

CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    slug VARCHAR(60) UNIQUE NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(120),
    telefone VARCHAR(20),
    config_erp JSONB DEFAULT '{}',
    config_notificacao JSONB DEFAULT '{}',
    criado_em TIMESTAMP DEFAULT NOW(),
    deletado_em TIMESTAMP
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    perfil VARCHAR(20) CHECK (perfil IN ('admin', 'vendedor', 'producao')),
    criado_em TIMESTAMP DEFAULT NOW(),
    deletado_em TIMESTAMP
);

CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    usuario_id UUID REFERENCES usuarios(id),
    acao VARCHAR(50) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    entidade_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- CATÁLOGO & CLIENTES
-- =============================================

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('fisica', 'juridica')),
    cpf_cnpj VARCHAR(18),
    email VARCHAR(120),
    telefone VARCHAR(20),
    endereco JSONB,
    nome_contato VARCHAR(120),
    erp_id VARCHAR(50),
    erp_sincronizado_em TIMESTAMP,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP,
    deletado_em TIMESTAMP
);

CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    url_imagem VARCHAR(500),
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP,
    deletado_em TIMESTAMP
);

CREATE TABLE modelos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    produto_id UUID NOT NULL REFERENCES produtos(id),
    nome VARCHAR(120) NOT NULL,
    url_imagem_frente VARCHAR(500),
    url_imagem_verso VARCHAR(500),
    tipo VARCHAR(20),
    gola VARCHAR(20),
    mangas VARCHAR(20),
    barras VARCHAR(20),
    recortes VARCHAR(30),
    bolsos VARCHAR(20),
    acabamento VARCHAR(20),
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP,
    deletado_em TIMESTAMP
);

CREATE TABLE materias_primas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('tecido', 'malha')),
    cor VARCHAR(40),
    composicao VARCHAR(120),
    preco DECIMAL(10,2),
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP,
    deletado_em TIMESTAMP
);

-- =============================================
-- PEDIDOS
-- =============================================

-- Controle de numeração sequencial por empresa (#0001, #0042...)
CREATE TABLE pedidos_contadores (
    empresa_id UUID PRIMARY KEY REFERENCES empresas(id),
    ultimo_numero INT NOT NULL DEFAULT 0
);

CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    numero INT NOT NULL,
    cliente_id UUID REFERENCES clientes(id),
    vendedor_id UUID REFERENCES usuarios(id),
    criado_por UUID REFERENCES usuarios(id),
    status VARCHAR(20) CHECK (status IN ('orcamento', 'aprovado', 'producao', 'finalizado', 'entregue')),
    observacoes TEXT,
    total DECIMAL(10,2),
    previsao_entrega DATE,
    data_entrega DATE,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP,
    deletado_em TIMESTAMP,
    UNIQUE(empresa_id, numero)
);

CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    produto_id UUID NOT NULL REFERENCES produtos(id),
    modelo_id UUID NOT NULL REFERENCES modelos(id),
    materia_prima_id UUID REFERENCES materias_primas(id),
    cor VARCHAR(80),
    tamanhos_quantidades JSONB,
    quantidade INT,
    preco_unitario DECIMAL(10,2),
    tipo_desconto VARCHAR(20) CHECK (tipo_desconto IN ('fixo', 'percentual')),
    desconto DECIMAL(10,2),
    total DECIMAL(10,2),
    especificacoes_modelo JSONB,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP,
    deletado_em TIMESTAMP
);

CREATE TABLE versoes_item_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_pedido_id UUID NOT NULL REFERENCES itens_pedido(id),
    numero_versao INT NOT NULL,
    snapshot JSONB NOT NULL,
    alterado_por UUID REFERENCES usuarios(id),
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE personalizacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    item_pedido_id UUID NOT NULL REFERENCES itens_pedido(id),
    tipo VARCHAR(20) CHECK (tipo IN ('serigrafia', 'DTF', 'bordado', 'sublimacao')),
    cores JSONB,
    tipo_conteudo VARCHAR(20) CHECK (tipo_conteudo IN ('imagem', 'texto')),
    url_imagem VARCHAR(500),
    texto_conteudo TEXT,
    texto_fonte VARCHAR(80),
    lado VARCHAR(10) CHECK (lado IN ('frente', 'verso')),
    localizacao VARCHAR(120),
    canvas_x FLOAT,
    canvas_y FLOAT,
    canvas_escala FLOAT,
    canvas_rotacao FLOAT,
    canvas_largura INT,
    canvas_altura INT,
    deletado_em TIMESTAMP
);

-- =============================================
-- PRODUÇÃO
-- =============================================

CREATE TABLE ordens_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    status VARCHAR(20) CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
    iniciado_em TIMESTAMP,
    finalizado_em TIMESTAMP,
    criado_em TIMESTAMP DEFAULT NOW(),
    deletado_em TIMESTAMP
);

CREATE TABLE configs_etapa_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    ordem INT NOT NULL,
    percentual_tempo INT CHECK (percentual_tempo > 0 AND percentual_tempo <= 100),
    criado_em TIMESTAMP DEFAULT NOW(),
    deletado_em TIMESTAMP
);

CREATE TABLE etapas_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_producao_id UUID NOT NULL REFERENCES ordens_producao(id),
    config_etapa_id UUID NOT NULL REFERENCES configs_etapa_producao(id),
    status VARCHAR(20) CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
    responsavel UUID REFERENCES usuarios(id),
    previsao_conclusao DATE,
    data_inicio DATE,
    iniciado_em TIMESTAMP,
    data_conclusao DATE,
    finalizado_em TIMESTAMP,
    deletado_em TIMESTAMP
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_erp_id ON clientes(erp_id);
CREATE INDEX idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX idx_modelos_produto ON modelos(produto_id);
CREATE INDEX idx_modelos_empresa ON modelos(empresa_id);
CREATE INDEX idx_materias_primas_empresa ON materias_primas(empresa_id);
CREATE INDEX idx_pedidos_empresa ON pedidos(empresa_id);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_vendedor ON pedidos(vendedor_id);
CREATE INDEX idx_itens_pedido_pedido ON itens_pedido(pedido_id);
CREATE INDEX idx_itens_pedido_empresa ON itens_pedido(empresa_id);
CREATE INDEX idx_personalizacoes_item ON personalizacoes(item_pedido_id);
CREATE INDEX idx_ordens_producao_pedido ON ordens_producao(pedido_id);
CREATE INDEX idx_ordens_producao_empresa ON ordens_producao(empresa_id);
CREATE INDEX idx_etapas_producao_ordem ON etapas_producao(ordem_producao_id);
CREATE INDEX idx_versoes_item_pedido_item ON versoes_item_pedido(item_pedido_id);
CREATE INDEX idx_etapas_producao_config ON etapas_producao(config_etapa_id);
CREATE INDEX idx_logs_auditoria_empresa ON logs_auditoria(empresa_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias_primas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_contadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE versoes_item_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs_etapa_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapas_producao ENABLE ROW LEVEL SECURITY;

-- Cada empresa só vê seus próprios dados
-- tenant.go executa: SET LOCAL app.current_empresa_id = '<uuid>' antes de cada query

CREATE POLICY "empresas_isolation" ON empresas
    USING (id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "usuarios_isolation" ON usuarios
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "logs_auditoria_isolation" ON logs_auditoria
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "clientes_isolation" ON clientes
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "produtos_isolation" ON produtos
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "modelos_isolation" ON modelos
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "materias_primas_isolation" ON materias_primas
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "pedidos_isolation" ON pedidos
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "pedidos_contadores_isolation" ON pedidos_contadores
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "itens_pedido_isolation" ON itens_pedido
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "personalizacoes_isolation" ON personalizacoes
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "ordens_producao_isolation" ON ordens_producao
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "configs_etapa_isolation" ON configs_etapa_producao
    USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

CREATE POLICY "versoes_item_isolation" ON versoes_item_pedido
    USING (
        item_pedido_id IN (
            SELECT id FROM itens_pedido
            WHERE empresa_id = current_setting('app.current_empresa_id')::uuid
        )
    );

CREATE POLICY "etapas_producao_isolation" ON etapas_producao
    USING (
        ordem_producao_id IN (
            SELECT id FROM ordens_producao
            WHERE empresa_id = current_setting('app.current_empresa_id')::uuid
        )
    );
