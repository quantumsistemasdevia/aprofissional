package production

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
)

type Repository struct{}

func NewRepository() *Repository { return &Repository{} }

// ---- Ordens ----

func (r *Repository) ListOrdens(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]OrdemProducao, error) {
	rows, err := qtx.QueryContext(ctx, `
		SELECT
			op.id, op.empresa_id, op.pedido_id, op.status,
			op.iniciado_em, op.finalizado_em, op.criado_em,
			p.numero                          AS pedido_numero,
			c.nome                            AS cliente_nome,
			COALESCE(SUM(ip.quantidade), 0)   AS quantidade,
			p.previsao_entrega
		FROM ordens_producao op
		JOIN pedidos p ON p.id = op.pedido_id
		LEFT JOIN clientes c ON c.id = p.cliente_id
		LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id AND ip.deletado_em IS NULL
		WHERE op.empresa_id = $1
		GROUP BY op.id, op.empresa_id, op.pedido_id, op.status,
		         op.iniciado_em, op.finalizado_em, op.criado_em,
		         p.numero, c.nome, p.previsao_entrega
		ORDER BY op.criado_em DESC
	`, empresaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]OrdemProducao, 0)
	for rows.Next() {
		var o OrdemProducao
		var status       sql.NullString
		var iniciadoEm   sql.NullTime
		var finalizadoEm sql.NullTime
		var criadoEm     sql.NullTime
		var pedidoNumero sql.NullInt32
		var clienteNome  sql.NullString
		var quantidade   sql.NullInt32
		var previsao     sql.NullTime

		if err := rows.Scan(
			&o.ID, &o.EmpresaID, &o.PedidoID, &status,
			&iniciadoEm, &finalizadoEm, &criadoEm,
			&pedidoNumero, &clienteNome, &quantidade, &previsao,
		); err != nil {
			return nil, err
		}

		if status.Valid       { o.Status          = &status.String       }
		if iniciadoEm.Valid   { o.IniciadoEm       = &iniciadoEm.Time    }
		if finalizadoEm.Valid { o.FinalizadoEm     = &finalizadoEm.Time  }
		if criadoEm.Valid     { o.CriadoEm         = &criadoEm.Time      }
		if pedidoNumero.Valid { o.PedidoNumero      = &pedidoNumero.Int32 }
		if clienteNome.Valid  { o.ClienteNome       = &clienteNome.String }
		if quantidade.Valid   { o.Quantidade        = &quantidade.Int32   }
		if previsao.Valid     { o.PrevisaoEntrega   = &previsao.Time      }

		result = append(result, o)
	}
	return result, rows.Err()
}

func (r *Repository) GetOrdem(ctx context.Context, qtx db.DBTX, id uuid.UUID) (OrdemProducao, error) {
	q := db.New(qtx)
	row, err := q.GetOrdem(ctx, id)
	if err != nil {
		return OrdemProducao{}, err
	}
	return toOrdem(row), nil
}

func (r *Repository) CreateOrdem(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateOrdemRequest) (OrdemProducao, error) {
	q := db.New(qtx)
	status := "pendente"
	if req.Status != nil {
		status = *req.Status
	}
	row, err := q.CreateOrdem(ctx, db.CreateOrdemParams{
		ID:        uuid.New(),
		EmpresaID: empresaID,
		PedidoID:  req.PedidoID,
		Status:    sql.NullString{String: status, Valid: true},
	})
	if err != nil {
		return OrdemProducao{}, err
	}
	return toOrdem(row), nil
}

func (r *Repository) UpdateOrdemStatus(ctx context.Context, qtx db.DBTX, id uuid.UUID, status string) (OrdemProducao, error) {
	q := db.New(qtx)
	row, err := q.UpdateOrdemStatus(ctx, db.UpdateOrdemStatusParams{
		ID:     id,
		Status: sql.NullString{String: status, Valid: true},
	})
	if err != nil {
		return OrdemProducao{}, err
	}
	return toOrdem(row), nil
}

func (r *Repository) DeleteOrdem(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	q := db.New(qtx)
	return q.DeleteOrdem(ctx, db.DeleteOrdemParams{ID: id, EmpresaID: empresaID})
}

// ---- Etapas ----

func (r *Repository) ListEtapas(ctx context.Context, qtx db.DBTX, ordemID uuid.UUID) ([]EtapaProducao, error) {
	q := db.New(qtx)
	rows, err := q.ListEtapas(ctx, ordemID)
	if err != nil {
		return nil, err
	}
	result := make([]EtapaProducao, 0, len(rows))
	for _, row := range rows {
		result = append(result, toEtapa(row))
	}
	return result, nil
}

func (r *Repository) GetEtapa(ctx context.Context, qtx db.DBTX, id uuid.UUID) (EtapaProducao, error) {
	q := db.New(qtx)
	row, err := q.GetEtapa(ctx, id)
	if err != nil {
		return EtapaProducao{}, err
	}
	return toEtapa(row), nil
}

func (r *Repository) CreateEtapa(ctx context.Context, qtx db.DBTX, ordemID, configID uuid.UUID, previsao sql.NullTime) (EtapaProducao, error) {
	q := db.New(qtx)
	row, err := q.CreateEtapa(ctx, db.CreateEtapaParams{
		ID:                uuid.New(),
		OrdemProducaoID:   ordemID,
		ConfigEtapaID:     configID,
		Status:            sql.NullString{String: "pendente", Valid: true},
		Responsavel:       uuid.NullUUID{},
		PrevisaoConclusao: previsao,
	})
	if err != nil {
		return EtapaProducao{}, err
	}
	return toEtapa(row), nil
}

func (r *Repository) UpdateEtapaStatus(ctx context.Context, qtx db.DBTX, id uuid.UUID, status string) (EtapaProducao, error) {
	q := db.New(qtx)
	row, err := q.UpdateEtapaStatus(ctx, db.UpdateEtapaStatusParams{
		ID:     id,
		Status: sql.NullString{String: status, Valid: true},
	})
	if err != nil {
		return EtapaProducao{}, err
	}
	return toEtapa(row), nil
}

// ---- Dashboard ----

func (r *Repository) DashboardEtapas(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]DashboardEtapaItem, error) {
	rows, err := qtx.QueryContext(ctx, `
		SELECT
			op.id,
			p.id,
			p.numero,
			COALESCE(c.nome, ''),
			COALESCE(SUM(ip.quantidade), 0),
			p.previsao_entrega,
			cep.id,
			cep.nome,
			cep.ordem,
			ep.id,
			COALESCE(ep.status, 'pendente'),
			ep.previsao_conclusao
		FROM ordens_producao op
		JOIN pedidos p                  ON p.id = op.pedido_id
		LEFT JOIN clientes c            ON c.id = p.cliente_id
		LEFT JOIN itens_pedido ip       ON ip.pedido_id = p.id AND ip.deletado_em IS NULL
		JOIN etapas_producao ep         ON ep.ordem_producao_id = op.id AND ep.deletado_em IS NULL
		JOIN configs_etapa_producao cep ON cep.id = ep.config_etapa_id
		WHERE op.empresa_id = $1
		  AND op.deletado_em IS NULL
		  AND op.status IN ('pendente', 'em_andamento')
		  AND ep.id = (
		      SELECT ep2.id
		      FROM etapas_producao ep2
		      JOIN configs_etapa_producao cep2 ON cep2.id = ep2.config_etapa_id
		      WHERE ep2.ordem_producao_id = op.id
		        AND ep2.deletado_em IS NULL
		        AND ep2.status != 'concluido'
		      ORDER BY cep2.ordem ASC
		      LIMIT 1
		  )
		GROUP BY op.id, p.id, p.numero, c.nome, p.previsao_entrega,
		         cep.id, cep.nome, cep.ordem, ep.id, ep.status, ep.previsao_conclusao
		ORDER BY cep.ordem ASC, p.previsao_entrega ASC NULLS LAST
	`, empresaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]DashboardEtapaItem, 0)
	for rows.Next() {
		var item DashboardEtapaItem
		var previsaoEntrega  sql.NullTime
		var etapaPrevisao    sql.NullTime

		if err := rows.Scan(
			&item.OrdemID,
			&item.PedidoID,
			&item.PedidoNumero,
			&item.ClienteNome,
			&item.Quantidade,
			&previsaoEntrega,
			&item.ConfigEtapaID,
			&item.EtapaNome,
			&item.EtapaOrdem,
			&item.EtapaID,
			&item.EtapaStatus,
			&etapaPrevisao,
		); err != nil {
			return nil, err
		}
		if previsaoEntrega.Valid { item.PrevisaoEntrega = &previsaoEntrega.Time }
		if etapaPrevisao.Valid   { item.EtapaPrevisao   = &etapaPrevisao.Time   }
		result = append(result, item)
	}
	return result, rows.Err()
}

// ---- Configs ----

func (r *Repository) ListConfigs(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]ConfigEtapa, error) {
	q := db.New(qtx)
	rows, err := q.ListConfigs(ctx, empresaID)
	if err != nil {
		return nil, err
	}
	result := make([]ConfigEtapa, 0, len(rows))
	for _, row := range rows {
		result = append(result, toConfigFromListRow(row))
	}
	return result, nil
}

func (r *Repository) GetConfig(ctx context.Context, qtx db.DBTX, id uuid.UUID) (ConfigEtapa, error) {
	q := db.New(qtx)
	row, err := q.GetConfig(ctx, id)
	if err != nil {
		return ConfigEtapa{}, err
	}
	return toConfigFromGetRow(row), nil
}

func (r *Repository) CreateConfig(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateConfigRequest) (ConfigEtapa, error) {
	q := db.New(qtx)
	row, err := q.CreateConfig(ctx, db.CreateConfigParams{
		ID:              uuid.New(),
		EmpresaID:       empresaID,
		Nome:            req.Nome,
		Ordem:           req.Ordem,
		PercentualTempo: sql.NullInt32{Int32: i32Val(req.PercentualTempo), Valid: req.PercentualTempo != nil},
	})
	if err != nil {
		return ConfigEtapa{}, err
	}
	return toConfigFromRow(row), nil
}

func (r *Repository) UpdateConfig(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateConfigRequest) (ConfigEtapa, error) {
	q := db.New(qtx)
	row, err := q.UpdateConfig(ctx, db.UpdateConfigParams{
		ID:              id,
		Nome:            req.Nome,
		Ordem:           req.Ordem,
		PercentualTempo: sql.NullInt32{Int32: i32Val(req.PercentualTempo), Valid: req.PercentualTempo != nil},
	})
	if err != nil {
		return ConfigEtapa{}, err
	}
	return toConfigFromUpdateRow(row), nil
}

func (r *Repository) DeleteConfig(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	q := db.New(qtx)
	return q.DeleteConfig(ctx, db.DeleteConfigParams{ID: id, EmpresaID: empresaID})
}

// ---- Helpers ----

func toOrdem(row db.OrdensProducao) OrdemProducao {
	o := OrdemProducao{ID: row.ID, EmpresaID: row.EmpresaID, PedidoID: row.PedidoID}
	if row.Status.Valid {
		o.Status = &row.Status.String
	}
	if row.IniciadoEm.Valid {
		t := row.IniciadoEm.Time
		o.IniciadoEm = &t
	}
	if row.FinalizadoEm.Valid {
		t := row.FinalizadoEm.Time
		o.FinalizadoEm = &t
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		o.CriadoEm = &t
	}
	return o
}

func toEtapa(row db.EtapasProducao) EtapaProducao {
	e := EtapaProducao{ID: row.ID, OrdemProducaoID: row.OrdemProducaoID, ConfigEtapaID: row.ConfigEtapaID}
	if row.Status.Valid {
		e.Status = &row.Status.String
	}
	if row.Responsavel.Valid {
		e.Responsavel = &row.Responsavel.UUID
	}
	if row.PrevisaoConclusao.Valid {
		t := row.PrevisaoConclusao.Time
		e.PrevisaoConclusao = &t
	}
	if row.DataInicio.Valid {
		t := row.DataInicio.Time
		e.DataInicio = &t
	}
	if row.IniciadoEm.Valid {
		t := row.IniciadoEm.Time
		e.IniciadoEm = &t
	}
	if row.DataConclusao.Valid {
		t := row.DataConclusao.Time
		e.DataConclusao = &t
	}
	if row.FinalizadoEm.Valid {
		t := row.FinalizadoEm.Time
		e.FinalizadoEm = &t
	}
	return e
}

func toConfigFromRow(row db.CreateConfigRow) ConfigEtapa {
	c := ConfigEtapa{ID: row.ID, EmpresaID: row.EmpresaID, Nome: row.Nome, Ordem: row.Ordem}
	if row.PercentualTempo.Valid {
		c.PercentualTempo = &row.PercentualTempo.Int32
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		c.CriadoEm = &t
	}
	return c
}

func toConfigFromListRow(row db.ListConfigsRow) ConfigEtapa {
	c := ConfigEtapa{ID: row.ID, EmpresaID: row.EmpresaID, Nome: row.Nome, Ordem: row.Ordem}
	if row.PercentualTempo.Valid {
		c.PercentualTempo = &row.PercentualTempo.Int32
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		c.CriadoEm = &t
	}
	return c
}

func toConfigFromGetRow(row db.GetConfigRow) ConfigEtapa {
	c := ConfigEtapa{ID: row.ID, EmpresaID: row.EmpresaID, Nome: row.Nome, Ordem: row.Ordem}
	if row.PercentualTempo.Valid {
		c.PercentualTempo = &row.PercentualTempo.Int32
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		c.CriadoEm = &t
	}
	return c
}

func toConfigFromUpdateRow(row db.UpdateConfigRow) ConfigEtapa {
	c := ConfigEtapa{ID: row.ID, EmpresaID: row.EmpresaID, Nome: row.Nome, Ordem: row.Ordem}
	if row.PercentualTempo.Valid {
		c.PercentualTempo = &row.PercentualTempo.Int32
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		c.CriadoEm = &t
	}
	return c
}

func i32Val(i *int32) int32 {
	if i == nil {
		return 0
	}
	return *i
}
