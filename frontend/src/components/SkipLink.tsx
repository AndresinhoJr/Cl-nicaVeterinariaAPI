/**
 * Skip navigation link — WCAG 2.4.1 (Bypass Blocks) — Level A
 * El primer elemento del DOM; permite a usuarios de teclado
 * saltar la navbar y ir directamente al contenido principal.
 *
 * Uso: colocarlo como primer hijo en App.tsx o en AuthLayout.tsx
 *
 * CSS: visible SOLO cuando recibe foco (usualmente via Tab),
 * invisible de otro modo para no afectar el diseño.
 */
export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Saltar al contenido principal
    </a>
  );
}
