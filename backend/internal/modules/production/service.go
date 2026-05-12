package production

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// ---- Ordens ----

func (s *Service) ListOrdens(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]OrdemProducao, error) {
	return s.repo.ListOrdens(ctx, qtx, empresaID)
}

func (s *Service) GetOrdem(ctx context.Context, qtx db.DBTX, id uuid.UUID) (OrdemProducao, error) {
	o, err := s.repo.GetOrdem(ctx, qtx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return OrdemProducao{}, errors.New("ordem não encontrada")
	}
	return o, err
}

// CreateOrdem cria uma nova ordem de produção e instancia as etapas a partir das configs.
func (s *Service) CreateOrdem(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateOrdemRequest, previsaoEntrega *time.Time) (OrdemProducao, error) {
	ordem, err := s.repo.CreateOrdem(ctx, qtx, empresaID, req)
	if err != nil {
		return OrdemProducao{}, err
	}

	// Buscar configs de etapas da empresa
	configs, err := s.repo.ListConfigs(ctx, qtx, empresaID)
	if err != nil || len(configs) == 0 {
		return ordem, nil // OK mesmo sem configs
	}

	// Calcular previsões
	now := time.Now()
	var previsoes map[uuid.UUID]time.Time
	if previsaoEntrega != nil {
		previsoes = CalcularPrevisaoConclusao(now, *previsaoEntrega, configs)
	}

	// Criar etapas
	for _, cfg := range configs {
		var previsao sql.NullTime
		if previsoes != nil {
			if t, ok := previsoes[cfg.ID]; ok {
				previsao = sql.NullTime{Time: t, Valid: true}
			}
		}
		_, _ = s.repo.CreateEtapa(ctx, qtx, ordem.ID, cfg.ID, previsao)
	}

	return ordem, nil
}

func (s *Service) UpdateOrdemStatus(ctx context.Context, qtx db.DBTX, id uuid.UUID, status string) (OrdemProducao, error) {
	validStatuses := map[string]bool{"pendente": true, "em_andamento": true, "concluida": true, "cancelada": true}
	if !validStatuses[status] {
		return OrdemProducao{}, errors.New("status inválido")
	}
	o, err := s.repo.UpdateOrdemStatus(ctx, qtx, id, status)
	if errors.Is(err, sql.ErrNoRows) {
		return OrdemProducao{}, errors.New("ordem não encontrada")
	}
	return o, err
}

func (s *Service) DeleteOrdem(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	return s.repo.DeleteOrdem(ctx, qtx, id, empresaID)
}

// ---- Etapas ----

func (s *Service) ListEtapas(ctx context.Context, qtx db.DBTX, ordemID uuid.UUID) ([]EtapaProducao, error) {
	return s.repo.ListEtapas(ctx, qtx, ordemID)
}

func (s *Service) GetEtapa(ctx context.Context, qtx db.DBTX, id uuid.UUID) (EtapaProducao, error) {
	e, err := s.repo.GetEtapa(ctx, qtx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return EtapaProducao{}, errors.New("etapa não encontrada")
	}
	return e, err
}

func (s *Service) UpdateEtapaStatus(ctx context.Context, qtx db.DBTX, id uuid.UUID, status string) (EtapaProducao, error) {
	validStatuses := map[string]bool{"pendente": true, "em_andamento": true, "concluido": true}
	if !validStatuses[status] {
		return EtapaProducao{}, errors.New("status inválido")
	}
	e, err := s.repo.UpdateEtapaStatus(ctx, qtx, id, status)
	if errors.Is(err, sql.ErrNoRows) {
		return EtapaProducao{}, errors.New("etapa não encontrada")
	}
	return e, err
}

// ---- Dashboard ----

func (s *Service) DashboardEtapas(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]DashboardEtapaItem, error) {
	return s.repo.DashboardEtapas(ctx, qtx, empresaID)
}

// ---- Configs ----

func (s *Service) ListConfigs(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]ConfigEtapa, error) {
	return s.repo.ListConfigs(ctx, qtx, empresaID)
}

func (s *Service) GetConfig(ctx context.Context, qtx db.DBTX, id uuid.UUID) (ConfigEtapa, error) {
	c, err := s.repo.GetConfig(ctx, qtx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return ConfigEtapa{}, errors.New("configuração não encontrada")
	}
	return c, err
}

func (s *Service) CreateConfig(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateConfigRequest) (ConfigEtapa, error) {
	if req.Nome == "" {
		return ConfigEtapa{}, errors.New("nome é obrigatório")
	}
	return s.repo.CreateConfig(ctx, qtx, empresaID, req)
}

func (s *Service) UpdateConfig(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateConfigRequest) (ConfigEtapa, error) {
	if req.Nome == "" {
		return ConfigEtapa{}, errors.New("nome é obrigatório")
	}
	c, err := s.repo.UpdateConfig(ctx, qtx, id, req)
	if errors.Is(err, sql.ErrNoRows) {
		return ConfigEtapa{}, errors.New("configuração não encontrada")
	}
	return c, err
}

func (s *Service) DeleteConfig(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	return s.repo.DeleteConfig(ctx, qtx, id, empresaID)
}

func (s *Service) CreateOrdemFromPedido(ctx context.Context, qtx db.DBTX, empresaID, pedidoID uuid.UUID, previsaoEntrega *time.Time) error {
	req := CreateOrdemRequest{PedidoID: pedidoID}
	_, err := s.CreateOrdem(ctx, qtx, empresaID, req, previsaoEntrega)
	return err
}
