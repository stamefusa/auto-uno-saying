// 手札ガイド枠の定義（画面幅・高さに対する割合）
export const GUIDE_FRAME = {
  // 枠の中心は画面下寄り（手元を映すため）
  xRatio: 0.1,      // 左端の位置（画面幅の10%）
  yRatio: 0.45,     // 上端の位置（画面高さの45%）
  widthRatio: 0.8,  // 枠の幅（画面幅の80%）
  heightRatio: 0.45, // 枠の高さ（画面高さの45%）
} as const
