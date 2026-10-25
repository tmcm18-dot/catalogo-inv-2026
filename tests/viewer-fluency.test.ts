import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

describe('primer pintado del visor en celular', () => {
  it('Lectura sin is-ready no usa el piso de 430px dentro del media query mobile', () => {
    const media = css.match(/@media \(max-width: 768px\) \{([\s\S]*?)\n\}/);
    expect(media?.[1]).toBeDefined();
    expect(media?.[1]).toMatch(
      /\.catalogReaderShell\.mode-lectura:not\(\.is-ready\) \.catalogPageStage \{[^}]*width:\s*min\(100cqw, calc\(100cqh \* var\(--page-ratio\)\)\);/,
    );
  });

  it('el piso de legibilidad de Lectura sigue en desktop', () => {
    expect(css).toMatch(/--min-legible:\s*430px/);
    expect(css).toMatch(/width:\s*max\(\s*var\(--min-legible\)/);
  });

  it('Ampliar en pantallas angostas sigue escalando desde el tamaño contenido', () => {
    const media = css.match(/@media \(max-width: 768px\) \{([\s\S]*?)\n\}/);
    expect(media?.[1]).toMatch(
      /\.catalogReaderShell\.mode-ampliar \.catalogPageStage \{[^}]*min\(100cqw, calc\(100cqh \* var\(--page-ratio\)\)\) \* var\(--zoom\)/,
    );
  });
});
