

/**
 * ThemeTopBar
 *
 * A 3px animated color bar that sits at the very top of the sticky header.
 * Uses --theme-color-1 through --theme-color-4 CSS variables, which are
 * defined per-theme in index.css.
 *
 * Animation: two halves sweep inward from opposite ends (scan effect),
 * then fade out to reveal the solid connected gradient underneath.
 *
 * Color logic sourced from SETXIO3/src/components/TopBar.tsx.
 * Implementation is vanilla React + CSS — no Tailwind, no Next.js.
 */
export function ThemeTopBar() {
  // Base layer: connected gradient that shows permanently
  const connectedGradient =
    'linear-gradient(45deg, var(--primary), var(--secondary), var(--primary))';

  // Overlay layer: spaced gradient with black gaps — used for the scan sweep effect
  const spacedGradient =
    'linear-gradient(45deg, #000000, #000000, var(--primary), #000000, #000000, var(--secondary), #000000, #000000, var(--primary), #000000, #000000)';

  return (
    <div style={{ position: 'relative', height: 3, width: '100%', overflow: 'hidden' }}>

      {/* Bottom layer: the final connected gradient (always visible) */}
      <div style={{ position: 'absolute', inset: 0, background: connectedGradient }} />

      {/* Top layer: split scan animation that fades out, left & right halves sweep inward */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>

        {/* Left half — sweeps right (inward) */}
        <div style={{ height: '100%', width: '50%', overflow: 'hidden', position: 'relative' }}>
          <div
            className="animate-scan-right-fade"
            style={{
              position: 'absolute',
              inset: 0,
              height: '100%',
              width: '200%',
              backgroundImage: spacedGradient,
              backgroundSize: '200% 200%',
            }}
          />
        </div>

        {/* Right half — sweeps left (inward) */}
        <div style={{ height: '100%', width: '50%', overflow: 'hidden', position: 'relative' }}>
          <div
            className="animate-scan-left-fade"
            style={{
              position: 'absolute',
              inset: 0,
              height: '100%',
              width: '200%',
              left: '-100%',
              backgroundImage: spacedGradient,
              backgroundSize: '200% 200%',
            }}
          />
        </div>

      </div>
    </div>
  );
}
