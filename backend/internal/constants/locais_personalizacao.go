package constants

// LocalPersonalizacao representa uma localização possível para estampa/bordado no produto.
type LocalPersonalizacao struct {
	Codigo string `json:"codigo"`
	Label  string `json:"label"`
}

// LocaisPersonalizacao lista os 24 locais de personalização suportados.
var LocaisPersonalizacao = []LocalPersonalizacao{
	{Codigo: "bolso_acima", Label: "Acima do bolso"},
	{Codigo: "bolso_esquerdo", Label: "Bolso esquerdo"},
	{Codigo: "bolso_direito", Label: "Bolso direito"},
	{Codigo: "centro_peito", Label: "Centro do peito"},
	{Codigo: "peito_esquerdo", Label: "Peito esquerdo"},
	{Codigo: "peito_direito", Label: "Peito direito"},
	{Codigo: "costas_topo", Label: "Topo das costas"},
	{Codigo: "costas_centro", Label: "Centro das costas"},
	{Codigo: "costas_base", Label: "Base das costas"},
	{Codigo: "manga_esquerda_superior", Label: "Manga esquerda superior"},
	{Codigo: "manga_esquerda_inferior", Label: "Manga esquerda inferior"},
	{Codigo: "manga_direita_superior", Label: "Manga direita superior"},
	{Codigo: "manga_direita_inferior", Label: "Manga direita inferior"},
	{Codigo: "gola_frente", Label: "Frente da gola"},
	{Codigo: "gola_costas", Label: "Costas da gola"},
	{Codigo: "punho_esquerdo", Label: "Punho esquerdo"},
	{Codigo: "punho_direito", Label: "Punho direito"},
	{Codigo: "barra_frente", Label: "Barra frontal"},
	{Codigo: "barra_costas", Label: "Barra traseira"},
	{Codigo: "lateral_esquerda", Label: "Lateral esquerda"},
	{Codigo: "lateral_direita", Label: "Lateral direita"},
	{Codigo: "capuz_frente", Label: "Frente do capuz"},
	{Codigo: "capuz_costas", Label: "Costas do capuz"},
	{Codigo: "local_ombros", Label: "Ombros"},
}
