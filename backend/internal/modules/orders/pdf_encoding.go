package orders

import "unicode/utf8"

// latin1 converte uma string UTF-8 para Latin-1 (ISO-8859-1 / Windows-1252).
// A função é idempotente: se chamada sobre uma string que já contém bytes
// Latin-1 brutos (resultado de uma chamada anterior), os bytes são mantidos.
// Bytes com código > 0xFF (fora do Latin-1) são descartados.
func latin1(s string) string {
	b := make([]byte, 0, len(s))
	for len(s) > 0 {
		r, size := utf8.DecodeRuneInString(s)
		if r == utf8.RuneError && size == 1 {
			// Byte inválido para UTF-8 — provavelmente já é um byte Latin-1
			// bruto de uma chamada anterior. Passa direto.
			b = append(b, s[0])
		} else if r < 0x100 {
			// Rune no intervalo Latin-1: o valor do code point == byte Latin-1.
			b = append(b, byte(r))
		}
		// Runes > 0xFF (fora do Latin-1) são silenciosamente descartados.
		s = s[size:]
	}
	return string(b)
}
