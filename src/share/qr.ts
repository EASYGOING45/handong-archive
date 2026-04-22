// src/share/qr.ts
import qrcode from 'qrcode-generator';

export interface QROptions {
  size: number;
  margin?: number;
  fg?: string;
  bg?: string;
}

export function drawQR(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  opts: QROptions,
): void {
  const qr = qrcode(0, 'H');
  qr.addData(url);
  qr.make();
  const count = qr.getModuleCount();
  const margin = opts.margin ?? 8;
  const cellSize = Math.floor((opts.size - margin * 2) / count);
  const effective = cellSize * count;
  ctx.fillStyle = opts.bg ?? '#ffffff';
  ctx.fillRect(x, y, opts.size, opts.size);
  ctx.fillStyle = opts.fg ?? '#000000';
  const ox = x + (opts.size - effective) / 2;
  const oy = y + (opts.size - effective) / 2;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(ox + c * cellSize, oy + r * cellSize, cellSize, cellSize);
      }
    }
  }
}
