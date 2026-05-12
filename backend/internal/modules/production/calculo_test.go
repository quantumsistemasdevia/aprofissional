package production

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestCalcularPrevisaoConclusao(t *testing.T) {
	// IDs de configs de exemplo
	cfg1ID := uuid.New()
	cfg2ID := uuid.New()
	cfg3ID := uuid.New()

	dataInicio := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	dataFim := time.Date(2026, 1, 11, 0, 0, 0, 0, time.UTC) // 10 dias depois

	t.Run("sem configs retorna mapa vazio", func(t *testing.T) {
		result := CalcularPrevisaoConclusao(dataInicio, dataFim, nil)
		if len(result) != 0 {
			t.Errorf("esperado mapa vazio, got %d entradas", len(result))
		}
	})

	t.Run("distribuição igualitária sem percentuais", func(t *testing.T) {
		configs := []ConfigEtapa{
			{ID: cfg1ID, Nome: "Corte", Ordem: 1},
			{ID: cfg2ID, Nome: "Costura", Ordem: 2},
		}
		result := CalcularPrevisaoConclusao(dataInicio, dataFim, configs)
		if len(result) != 2 {
			t.Fatalf("esperado 2 entradas, got %d", len(result))
		}
		// Etapa 1 deve ser em 5 dias (metade do intervalo)
		etapa1 := result[cfg1ID]
		expectedEtapa1 := dataInicio.Add(5 * 24 * time.Hour)
		if !etapa1.Equal(expectedEtapa1) {
			t.Errorf("etapa1: esperado %v, got %v", expectedEtapa1, etapa1)
		}
		// Etapa 2 deve ser em 10 dias (fim)
		etapa2 := result[cfg2ID]
		expectedEtapa2 := dataInicio.Add(10 * 24 * time.Hour)
		if !etapa2.Equal(expectedEtapa2) {
			t.Errorf("etapa2: esperado %v, got %v", expectedEtapa2, etapa2)
		}
	})

	t.Run("distribuição proporcional com percentuais", func(t *testing.T) {
		pct20 := int32(20)
		pct30 := int32(30)
		pct50 := int32(50)
		configs := []ConfigEtapa{
			{ID: cfg1ID, Nome: "Corte", Ordem: 1, PercentualTempo: &pct20},
			{ID: cfg2ID, Nome: "Costura", Ordem: 2, PercentualTempo: &pct30},
			{ID: cfg3ID, Nome: "Acabamento", Ordem: 3, PercentualTempo: &pct50},
		}
		result := CalcularPrevisaoConclusao(dataInicio, dataFim, configs)
		if len(result) != 3 {
			t.Fatalf("esperado 3 entradas, got %d", len(result))
		}
		// 20% de 10 dias = 2 dias para etapa 1
		etapa1 := result[cfg1ID]
		expected1 := dataInicio.Add(2 * 24 * time.Hour)
		if !etapa1.Equal(expected1) {
			t.Errorf("etapa1: esperado %v, got %v", expected1, etapa1)
		}
		// 50% de 10 dias = 5 dias acumulados para etapa 2 (20+30)
		etapa2 := result[cfg2ID]
		expected2 := dataInicio.Add(5 * 24 * time.Hour)
		if !etapa2.Equal(expected2) {
			t.Errorf("etapa2: esperado %v, got %v", expected2, etapa2)
		}
		// 100% de 10 dias = 10 dias acumulados para etapa 3 (20+30+50)
		etapa3 := result[cfg3ID]
		expected3 := dataFim
		if !etapa3.Equal(expected3) {
			t.Errorf("etapa3: esperado %v, got %v", expected3, etapa3)
		}
	})

	t.Run("intervalo inválido retorna previsaoEntrega para todas", func(t *testing.T) {
		configs := []ConfigEtapa{
			{ID: cfg1ID, Nome: "Corte", Ordem: 1},
		}
		// dataFim antes de dataInicio
		result := CalcularPrevisaoConclusao(dataFim, dataInicio, configs)
		if len(result) != 1 {
			t.Fatalf("esperado 1 entrada, got %d", len(result))
		}
		etapa1 := result[cfg1ID]
		if !etapa1.Equal(dataInicio) { // dataInicio é o "previsaoEntrega" passado aqui
			t.Errorf("etapa1: esperado %v, got %v", dataInicio, etapa1)
		}
	})
}
