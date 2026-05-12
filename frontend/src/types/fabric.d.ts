/**
 * Minimal ambient declaration for fabric v5 (no official @types/fabric for v5).
 * The canvas component uses a dynamic import so full types are not needed here.
 */
declare module 'fabric' {
  export const fabric: Record<string, unknown>
}
