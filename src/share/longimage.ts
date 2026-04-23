// src/share/longimage.ts
import { drawQR } from './qr';
import { FACTION_LABELS } from '../engine/faction';
import type { Faction, Scores } from '../engine/types';

const SERIF = '"Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "STSong", serif';

const PAPER = '#f4ece0';
const INK = '#1a1a1a';
const STAMP = '#8b2e2e';
const MUTED = '#7a7067';

export interface LongImageInput {
  name: string;
  role: string;
  typeCode: string;
  quote: string;
  scores: Scores;
  faction: Faction;
  image: string;
  resultUrl: string;
}

const W = 1080;
const DPR = 2;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export async function composeLongImage(input: LongImageInput): Promise<HTMLCanvasElement> {
  // First pass: measure total height.
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('composeLongImage: 2d context unavailable');
  ctx.scale(DPR, DPR);

  // Background paper
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Soft vignette
  const grad = ctx.createRadialGradient(W / 2, H / 2, W / 3, W / 2, H / 2, W);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const PAD = 72;
  let y = 96;

  // ---------- Header ----------
  ctx.fillStyle = MUTED;
  ctx.font = `24px ${SERIF}`;
  ctx.textAlign = 'left';
  ctx.fillText('汉东省人格档案室 · 干部作风评估处', PAD, y);

  ctx.textAlign = 'right';
  const archiveNo = `档案编号 · ${input.typeCode}-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  ctx.fillText(archiveNo, W - PAD, y);

  y += 18;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(PAD, y + 6);
  ctx.lineTo(W - PAD, y + 6);
  ctx.stroke();

  y += 56;

  // ---------- Photo ----------
  const photoX = PAD;
  const photoY = y;
  const photoW = 300;
  const photoH = 400;

  let img: HTMLImageElement | null = null;
  try {
    img = await loadImage(input.image);
  } catch {
    img = null;
  }

  // Photo frame
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(photoX, photoY, photoW, photoH);
  ctx.fillStyle = PAPER;
  ctx.fillRect(photoX + 6, photoY + 6, photoW - 12, photoH - 12);
  if (img) {
    ctx.drawImage(img, photoX + 12, photoY + 12, photoW - 24, photoH - 24);
  } else {
    ctx.fillStyle = MUTED;
    ctx.font = `24px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.fillText('（照片缺失）', photoX + photoW / 2, photoY + photoH / 2);
  }

  ctx.fillStyle = INK;
  ctx.font = `bold 28px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.fillText(input.name, photoX + photoW / 2, photoY + photoH + 40);

  // ---------- Info table on the right of photo ----------
  const infoX = photoX + photoW + 48;
  const infoW = W - PAD - infoX;
  let infoY = photoY + 20;

  const infoRow = (label: string, value: string): void => {
    ctx.fillStyle = MUTED;
    ctx.font = `22px ${SERIF}`;
    ctx.textAlign = 'left';
    ctx.fillText(label, infoX, infoY);
    ctx.fillStyle = INK;
    ctx.font = `bold 28px ${SERIF}`;
    ctx.fillText(value, infoX + 120, infoY);
    infoY += 20;
    ctx.strokeStyle = MUTED;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(infoX, infoY);
    ctx.lineTo(infoX + infoW, infoY);
    ctx.stroke();
    ctx.setLineDash([]);
    infoY += 28;
  };

  infoRow('姓　名', input.name);
  infoRow('职　务', input.role);
  infoRow('类型码', input.typeCode);
  infoRow('阵　营', FACTION_LABELS[input.faction]);

  y = Math.max(photoY + photoH + 80, infoY + 20);

  // ---------- Quote ----------
  y += 24;
  ctx.save();
  ctx.translate(W / 2, y + 40);
  ctx.rotate(-0.015);
  ctx.strokeStyle = STAMP;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  const quoteBoxW = W - PAD * 2;
  const quoteBoxH = 100;
  ctx.strokeRect(-quoteBoxW / 2, -quoteBoxH / 2, quoteBoxW, quoteBoxH);
  ctx.setLineDash([]);
  ctx.fillStyle = STAMP;
  ctx.font = `italic 36px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`"${input.quote}"`, 0, 0);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
  y += quoteBoxH + 40;

  // ---------- Dimension bars ----------
  ctx.fillStyle = INK;
  ctx.font = `bold 32px ${SERIF}`;
  ctx.textAlign = 'left';
  ctx.fillText('四维画像', PAD, y);
  y += 32;

  const bars: { left: string; right: string; score: number }[] = [
    { left: '理想主义', right: '现实主义', score: input.scores.I },
    { left: '规则坚守', right: '权变灵活', score: input.scores.L },
    { left: '集体协作', right: '独断专行', score: input.scores.C },
    { left: '锐意进取', right: '谨慎守成', score: input.scores.D },
  ];
  const barX = PAD + 160;
  const barRightLabelX = W - PAD - 160;
  const barW = barRightLabelX - barX - 24;
  for (const bar of bars) {
    ctx.fillStyle = MUTED;
    ctx.font = `22px ${SERIF}`;
    ctx.textAlign = 'right';
    ctx.fillText(bar.left, PAD + 150, y + 6);
    ctx.textAlign = 'left';
    ctx.fillText(bar.right, barRightLabelX, y + 6);

    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(barX, y);
    ctx.lineTo(barX + barW, y);
    ctx.stroke();

    const pct = (-bar.score + 16) / 32;
    const mx = barX + pct * barW;
    ctx.fillStyle = STAMP;
    ctx.beginPath();
    ctx.arc(mx, y, 10, 0, Math.PI * 2);
    ctx.fill();

    y += 56;
  }

  y += 24;

  // ---------- QR block ----------
  const qrSize = 260;
  const qrX = W - PAD - qrSize;
  const qrY = H - PAD - qrSize - 40;

  // QR frame
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);
  drawQR(ctx, input.resultUrl, qrX, qrY, { size: qrSize, margin: 12, fg: INK, bg: PAPER });

  // QR caption
  ctx.fillStyle = MUTED;
  ctx.font = `20px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.fillText('扫码查看完整档案', qrX + qrSize / 2, qrY + qrSize + 32);

  // Left side footer: site name + type code
  ctx.fillStyle = INK;
  ctx.font = `bold 40px ${SERIF}`;
  ctx.textAlign = 'left';
  ctx.fillText('人民的名义 · 人格测评', PAD, qrY + 40);
  ctx.fillStyle = STAMP;
  ctx.font = `bold 56px ${SERIF}`;
  ctx.fillText(input.typeCode, PAD, qrY + 112);
  ctx.fillStyle = MUTED;
  ctx.font = `22px ${SERIF}`;
  ctx.fillText(input.role, PAD, qrY + 150);

  // Stamp
  ctx.save();
  ctx.translate(PAD + 320, qrY + 220);
  ctx.rotate(-0.12);
  ctx.strokeStyle = STAMP;
  ctx.lineWidth = 3;
  ctx.strokeRect(-90, -32, 180, 64);
  ctx.fillStyle = STAMP;
  ctx.font = `bold 32px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('已归档', 0, 0);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  return canvas;
}

export async function downloadLongImage(input: LongImageInput): Promise<void> {
  const canvas = await composeLongImage(input);
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  );
  if (!blob) throw new Error('downloadLongImage: toBlob failed');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `人民的名义_${input.typeCode}_${input.name}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
