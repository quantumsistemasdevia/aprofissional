package production

import (
	"time"

	"github.com/google/uuid"
)

// CalcularPrevisaoConclusao distribui o intervalo de tempo entre dataInicio e previsaoEntrega
// entre as etapas de acordo com o percentual_tempo de cada config.
// Retorna um map de config_etapa_id → data de previsão de conclusão.
func CalcularPrevisaoConclusao(dataInicio, previsaoEntrega time.Time, configs []ConfigEtapa) map[uuid.UUID]time.Time {
	result := make(map[uuid.UUID]time.Time)
	if len(configs) == 0 {
		return result
	}

	totalDuration := previsaoEntrega.Sub(dataInicio)
	if totalDuration <= 0 {
		// Sem intervalo válido: todas as etapas apontam para previsaoEntrega
		for _, c := range configs {
			result[c.ID] = previsaoEntrega
		}
		return result
	}

	// Calcular soma dos percentuais informados
	totalPercentual := 0
	for _, c := range configs {
		if c.PercentualTempo != nil {
			totalPercentual += int(*c.PercentualTempo)
		}
	}

	// Se nenhum percentual definido, distribuir igualmente
	if totalPercentual == 0 {
		step := totalDuration / time.Duration(len(configs))
		for i, c := range configs {
			result[c.ID] = dataInicio.Add(step * time.Duration(i+1))
		}
		return result
	}

	// Distribuir proporcionalmente pelos percentuais
	acumulado := time.Duration(0)
	for _, c := range configs {
		pct := 0
		if c.PercentualTempo != nil {
			pct = int(*c.PercentualTempo)
		}
		frac := float64(pct) / float64(totalPercentual)
		etapaDuration := time.Duration(float64(totalDuration) * frac)
		acumulado += etapaDuration
		result[c.ID] = dataInicio.Add(acumulado)
	}

	return result
}
