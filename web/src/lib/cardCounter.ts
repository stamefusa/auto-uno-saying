/**
 * UNO色相フィルタ + 白枠隣接チェックによるカード有無判定
 *
 * アルゴリズム:
 * 1. RGB → HSV 変換
 * 2. UNO固有の色相範囲（赤・青・緑・黄）かつ高彩度のピクセルを抽出（案A）
 * 3. 白マスク（低彩度・高輝度）の積分画像を構築し、
 *    近傍 whiteNeighborRadius px 内に白ピクセルがある UNO色ピクセルだけを採用（案B）
 * 4. 面積比で none / single / multiple を判定
 */

// デフォルトのチューニングパラメータ
export const DEFAULT_PARAMS: CardDetectParams = {
  satThreshold: 100,
  whiteSatMax: 40,
  whiteValMin: 180,
  whiteNeighborRadius: 15,
  ratioNone: 0.03,
  ratioSingle: 0.09,
}

export interface CardDetectParams {
  satThreshold: number         // UNO色: 彩度閾値 (0-255)
  whiteSatMax: number          // 白判定: 彩度上限 (0-255)
  whiteValMin: number          // 白判定: 輝度下限 (0-255)
  whiteNeighborRadius: number  // 白隣接チェックの半径 (px)
  ratioNone: number            // この面積比以下 → カードなし
  ratioSingle: number          // この面積比以下 → 1枚、超えると複数枚
}

// UNOカードの色相範囲 (0-360°)
const UNO_HUE_RANGES: [number, number][] = [
  [0, 20],    // 赤（低側）
  [340, 360], // 赤（高側）
  [40, 65],   // 黄
  [100, 150], // 緑
  [210, 250], // 青
]

export type CardState = 'none' | 'single' | 'multiple'

export interface CardDetection {
  state: CardState
  cardRatio: number
}

/** RGB → HSV (H: 0-360, S: 0-255, V: 0-255) */
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  if (delta > 0) {
    if (max === rn)      h = 60 * (((gn - bn) / delta) % 6)
    else if (max === gn) h = 60 * (((bn - rn) / delta) + 2)
    else                 h = 60 * (((rn - gn) / delta) + 4)
    if (h < 0) h += 360
  }

  const s = max === 0 ? 0 : (delta / max) * 255
  const v = max * 255
  return [h, s, v]
}

function buildWhiteIntegral(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  whiteSatMax: number,
  whiteValMin: number,
): Int32Array {
  const integral = new Int32Array((width + 1) * (height + 1))
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const [, s, v] = rgbToHsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
      const isWhite = s <= whiteSatMax && v >= whiteValMin ? 1 : 0
      const iy = y + 1, ix = x + 1
      integral[iy * (width + 1) + ix] =
        isWhite
        + integral[(iy - 1) * (width + 1) + ix]
        + integral[iy * (width + 1) + (ix - 1)]
        - integral[(iy - 1) * (width + 1) + (ix - 1)]
    }
  }
  return integral
}

function whiteCountInRect(
  integral: Int32Array,
  width: number,
  x1: number, y1: number, x2: number, y2: number,
): number {
  const w1 = width + 1
  return (
    integral[(y2 + 1) * w1 + (x2 + 1)]
    - integral[y1 * w1 + (x2 + 1)]
    - integral[(y2 + 1) * w1 + x1]
    + integral[y1 * w1 + x1]
  )
}

function compute(canvas: HTMLCanvasElement, params: CardDetectParams) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  const { width, height } = canvas
  if (width === 0 || height === 0) return null

  const { satThreshold, whiteSatMax, whiteValMin, whiteNeighborRadius } = params
  const { data } = ctx.getImageData(0, 0, width, height)
  const total = width * height
  const r = whiteNeighborRadius

  const integral = buildWhiteIntegral(data, width, height, whiteSatMax, whiteValMin)

  const whiteMask = new Uint8ClampedArray(total)
  for (let i = 0; i < total; i++) {
    const [, s, v] = rgbToHsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
    if (s <= whiteSatMax && v >= whiteValMin) whiteMask[i] = 255
  }

  const cardMask = new Uint8ClampedArray(total)
  let cardCount = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const [h, s] = rgbToHsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
      if (s < satThreshold) continue
      if (!UNO_HUE_RANGES.some(([lo, hi]) => h >= lo && h <= hi)) continue

      const x1 = Math.max(0, x - r), y1 = Math.max(0, y - r)
      const x2 = Math.min(width - 1, x + r), y2 = Math.min(height - 1, y + r)
      if (whiteCountInRect(integral, width, x1, y1, x2, y2) > 0) {
        cardMask[i] = 255
        cardCount++
      }
    }
  }

  return { cardMask, whiteMask, cardRatio: cardCount / total, width, height }
}

export function detectCards(
  canvas: HTMLCanvasElement,
  params: CardDetectParams = DEFAULT_PARAMS,
): CardDetection {
  const result = compute(canvas, params)
  if (!result) return { state: 'none', cardRatio: 0 }

  const { cardRatio } = result
  const state: CardState =
    cardRatio <= params.ratioNone ? 'none' :
    cardRatio <= params.ratioSingle ? 'single' :
    'multiple'

  return { state, cardRatio }
}

export function drawDebugOverlay(
  srcCanvas: HTMLCanvasElement,
  overlayCanvas: HTMLCanvasElement,
  params: CardDetectParams = DEFAULT_PARAMS,
) {
  const result = compute(srcCanvas, params)
  if (!result) return

  const { cardMask, whiteMask, cardRatio, width, height } = result
  const { ratioNone, ratioSingle } = params

  overlayCanvas.width = width
  overlayCanvas.height = height

  const ctx = overlayCanvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  const imgData = ctx.createImageData(width, height)
  for (let i = 0; i < width * height; i++) {
    if (cardMask[i]) {
      imgData.data[i * 4 + 0] = 0;   imgData.data[i * 4 + 1] = 255
      imgData.data[i * 4 + 2] = 0;   imgData.data[i * 4 + 3] = 150
    } else if (whiteMask[i]) {
      imgData.data[i * 4 + 0] = 0;   imgData.data[i * 4 + 1] = 200
      imgData.data[i * 4 + 2] = 255; imgData.data[i * 4 + 3] = 120
    } else {
      imgData.data[i * 4 + 0] = 180; imgData.data[i * 4 + 1] = 0
      imgData.data[i * 4 + 2] = 0;   imgData.data[i * 4 + 3] = 40
    }
  }
  ctx.putImageData(imgData, 0, 0)

  const barH = 16, barY = height - barH
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, barY, width, barH)

  const fillW = Math.round(cardRatio * width)
  ctx.fillStyle = cardRatio <= ratioNone ? '#888' : cardRatio <= ratioSingle ? '#facc15' : '#22c55e'
  ctx.fillRect(0, barY + 2, fillW, barH - 4)

  ctx.setLineDash([2, 2])
  ctx.strokeStyle = '#facc15'
  ctx.beginPath()
  ctx.moveTo(Math.round(ratioSingle * width), barY)
  ctx.lineTo(Math.round(ratioSingle * width), height)
  ctx.stroke()
  ctx.strokeStyle = '#aaa'
  ctx.beginPath()
  ctx.moveTo(Math.round(ratioNone * width), barY)
  ctx.lineTo(Math.round(ratioNone * width), height)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 10px monospace'
  ctx.fillText(`uno: ${(cardRatio * 100).toFixed(1)}%`, 4, barY + barH - 3)
}
