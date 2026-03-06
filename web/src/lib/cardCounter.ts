/**
 * UNO色相フィルタ + 白枠隣接チェックによるカード有無判定
 *
 * アルゴリズム:
 * 1. RGB → HSV 変換
 * 2. UNO固有の色相範囲（赤・青・緑・黄）かつ高彩度のピクセルを抽出（案A）
 * 3. 白マスク（低彩度・高輝度）の積分画像を構築し、
 *    近傍 WHITE_NEIGHBOR_RADIUS px 内に白ピクセルがある UNO色ピクセルだけを採用（案B）
 * 4. 面積比で none / single / multiple を判定
 */

// チューニングパラメータ
const SAT_THRESHOLD = 100          // UNO色: 彩度閾値 (0-255)
const WHITE_SAT_MAX = 40           // 白判定: 彩度上限 (0-255)
const WHITE_VAL_MIN = 180          // 白判定: 輝度下限 (0-255)
const WHITE_NEIGHBOR_RADIUS = 15   // 白隣接チェックの半径 (px)
const RATIO_NONE = 0.03            // この面積比以下 → カードなし
const RATIO_SINGLE = 0.09          // この面積比以下 → 1枚、超えると複数枚

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
  cardRatio: number  // カード色ピクセルの面積比 (0.0-1.0)
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

function isUnoColor(h: number, s: number): boolean {
  if (s < SAT_THRESHOLD) return false
  return UNO_HUE_RANGES.some(([lo, hi]) => h >= lo && h <= hi)
}

/** 白マスクの積分画像を構築する */
function buildWhiteIntegral(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Int32Array {
  const integral = new Int32Array((width + 1) * (height + 1))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const [, s, v] = rgbToHsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
      const isWhite = s <= WHITE_SAT_MAX && v >= WHITE_VAL_MIN ? 1 : 0

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

/** 積分画像で矩形内の白ピクセル数を O(1) で取得 */
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

function compute(canvas: HTMLCanvasElement): {
  cardMask: Uint8ClampedArray
  whiteMask: Uint8ClampedArray
  cardRatio: number
  width: number
  height: number
} | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  const { width, height } = canvas
  if (width === 0 || height === 0) return null

  const { data } = ctx.getImageData(0, 0, width, height)
  const total = width * height
  const r = WHITE_NEIGHBOR_RADIUS

  // 白マスクの積分画像を構築
  const integral = buildWhiteIntegral(data, width, height)

  // 白マスク（デバッグ描画用）
  const whiteMask = new Uint8ClampedArray(total)
  for (let i = 0; i < total; i++) {
    const [, s, v] = rgbToHsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
    if (s <= WHITE_SAT_MAX && v >= WHITE_VAL_MIN) whiteMask[i] = 255
  }

  // UNO色 AND 白隣接のマスクを生成
  const cardMask = new Uint8ClampedArray(total)
  let cardCount = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const [h, s] = rgbToHsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
      if (!isUnoColor(h, s)) continue

      // 近傍に白ピクセルがあるか積分画像で確認
      const x1 = Math.max(0, x - r)
      const y1 = Math.max(0, y - r)
      const x2 = Math.min(width - 1, x + r)
      const y2 = Math.min(height - 1, y + r)
      if (whiteCountInRect(integral, width, x1, y1, x2, y2) > 0) {
        cardMask[i] = 255
        cardCount++
      }
    }
  }

  return { cardMask, whiteMask, cardRatio: cardCount / total, width, height }
}

export function detectCards(canvas: HTMLCanvasElement): CardDetection {
  const result = compute(canvas)
  if (!result) return { state: 'none', cardRatio: 0 }

  const { cardRatio } = result
  const state: CardState =
    cardRatio <= RATIO_NONE ? 'none' :
    cardRatio <= RATIO_SINGLE ? 'single' :
    'multiple'

  return { state, cardRatio }
}

/**
 * デバッグ用: カードマスク・白マスク・面積比バーを描画する
 */
export function drawDebugOverlay(
  srcCanvas: HTMLCanvasElement,
  overlayCanvas: HTMLCanvasElement,
) {
  const result = compute(srcCanvas)
  if (!result) return

  const { cardMask, whiteMask, cardRatio, width, height } = result

  overlayCanvas.width = width
  overlayCanvas.height = height

  const ctx = overlayCanvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  // カードマスク: 緑 / 白検出: 水色 / それ以外: 暗い赤
  const imgData = ctx.createImageData(width, height)
  for (let i = 0; i < width * height; i++) {
    if (cardMask[i]) {
      // UNO色 + 白隣接 → 緑
      imgData.data[i * 4 + 0] = 0
      imgData.data[i * 4 + 1] = 255
      imgData.data[i * 4 + 2] = 0
      imgData.data[i * 4 + 3] = 150
    } else if (whiteMask[i]) {
      // 白領域 → 水色
      imgData.data[i * 4 + 0] = 0
      imgData.data[i * 4 + 1] = 200
      imgData.data[i * 4 + 2] = 255
      imgData.data[i * 4 + 3] = 120
    } else {
      // その他 → 暗い赤
      imgData.data[i * 4 + 0] = 180
      imgData.data[i * 4 + 1] = 0
      imgData.data[i * 4 + 2] = 0
      imgData.data[i * 4 + 3] = 40
    }
  }
  ctx.putImageData(imgData, 0, 0)

  // 面積比バー（下部）
  const barH = 16
  const barY = height - barH
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, barY, width, barH)

  const fillW = Math.round(cardRatio * width)
  ctx.fillStyle =
    cardRatio <= RATIO_NONE ? '#888' :
    cardRatio <= RATIO_SINGLE ? '#facc15' :
    '#22c55e'
  ctx.fillRect(0, barY + 2, fillW, barH - 4)

  ctx.setLineDash([2, 2])
  ctx.strokeStyle = '#facc15'
  ctx.beginPath()
  ctx.moveTo(Math.round(RATIO_SINGLE * width), barY)
  ctx.lineTo(Math.round(RATIO_SINGLE * width), height)
  ctx.stroke()
  ctx.strokeStyle = '#aaa'
  ctx.beginPath()
  ctx.moveTo(Math.round(RATIO_NONE * width), barY)
  ctx.lineTo(Math.round(RATIO_NONE * width), height)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 10px monospace'
  ctx.fillText(`uno: ${(cardRatio * 100).toFixed(1)}%`, 4, barY + barH - 3)
}
