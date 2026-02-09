/**
 * Decode image from file URI to a Float32 RGB tensor [1, height, width, 3] normalized 0-1.
 * Used as input for YOLOv8 TFLite (NHWC, 640x640).
 */
import * as FileSystem from 'expo-file-system/legacy';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jpeg = require('jpeg-js');

const TARGET_SIZE = 640;

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Simple bilinear resize of RGBA image to target width x height. Returns RGB only.
 */
function resizeRgbaToRgb(
  srcData: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Float32Array {
  const dst = new Float32Array(dstW * dstH * 3);
  const srcStride = srcW * 4;

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx = (dx / (dstW - 1)) * (srcW - 1);
      const sy = (dy / (dstH - 1)) * (srcH - 1);
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const y1 = Math.min(y0 + 1, srcH - 1);
      const fx = sx - x0;
      const fy = sy - y0;

      const idx = (dy * dstW + dx) * 3;
      for (let c = 0; c < 3; c++) {
        const p00 = srcData[(y0 * srcW + x0) * 4 + c] / 255;
        const p10 = srcData[(y0 * srcW + x1) * 4 + c] / 255;
        const p01 = srcData[(y1 * srcW + x0) * 4 + c] / 255;
        const p11 = srcData[(y1 * srcW + x1) * 4 + c] / 255;
        const p0 = p00 * (1 - fx) + p10 * fx;
        const p1 = p01 * (1 - fx) + p11 * fx;
        dst[idx + c] = p0 * (1 - fy) + p1 * fy;
      }
    }
  }
  return dst;
}

export type ImageTensor = {
  shape: [number, number, number, number];
  data: Float32Array;
};

function tensorStats(data: Float32Array): { min: number; max: number; mean: number } {
  let min = data[0] ?? 0;
  let max = data[0] ?? 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] ?? 0;
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { min, max, mean: sum / data.length };
}

/**
 * Load image from file URI (e.g. from expo-camera takePictureAsync), decode JPEG,
 * resize to TARGET_SIZE x TARGET_SIZE, normalize to [0,1], return NHWC tensor.
 */
export async function imageUriToTensor(uri: string): Promise<ImageTensor | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = base64ToUint8Array(base64);
    const decoded = jpeg.decode(bytes, { useTArray: true });
    if (!decoded?.data || !decoded.width || !decoded.height) {
      if (__DEV__) console.log('[scanner] imageUriToTensor: decode failed or empty image');
      return null;
    }

    const { data, width, height } = decoded;
    if (__DEV__) {
      console.log('[scanner] imageUriToTensor: decoded', width, 'x', height, 'pixels');
    }
    const rgbFloat = resizeRgbaToRgb(data, width, height, TARGET_SIZE, TARGET_SIZE);
    const stats = tensorStats(rgbFloat);
    if (__DEV__) {
      console.log('[scanner] imageUriToTensor: input tensor', TARGET_SIZE, 'x', TARGET_SIZE, 'x 3, stats min:', stats.min.toFixed(3), 'max:', stats.max.toFixed(3), 'mean:', stats.mean.toFixed(3));
    }
    return {
      shape: [1, TARGET_SIZE, TARGET_SIZE, 3],
      data: rgbFloat,
    };
  } catch (e) {
    if (__DEV__) console.warn('[scanner] imageUriToTensor failed', e);
    return null;
  }
}
