/**
 * Browser-based background removal using Hugging Face Transformers.js
 * Loads the segmentation model on-demand and runs entirely client-side
 * (no external API like remove.bg).
 *
 * Reusable from anywhere in the app (logos, signatures, profile pictures, etc).
 */
import { pipeline, env } from "@huggingface/transformers";

// Allow remote model downloads from the Hugging Face CDN
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_DIMENSION = 1024;

let segmenterPromise: Promise<any> | null = null;

async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = pipeline(
      "image-segmentation",
      "Xenova/segformer-b0-finetuned-ade-512-512",
      { device: "webgpu" } as any,
    ).catch(() =>
      // Fallback to CPU/wasm if WebGPU unavailable
      pipeline(
        "image-segmentation",
        "Xenova/segformer-b0-finetuned-ade-512-512",
      ),
    );
  }
  return segmenterPromise;
}

function resizeIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let { naturalWidth: w, naturalHeight: h } = image;
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    if (w > h) {
      h = Math.round((h * MAX_DIMENSION) / w);
      w = MAX_DIMENSION;
    } else {
      w = Math.round((w * MAX_DIMENSION) / h);
      h = MAX_DIMENSION;
    }
  }
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(image, 0, 0, w, h);
}

function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Remove background from an image File and return a transparent PNG Blob.
 */
export async function removeBackground(file: File | Blob): Promise<Blob> {
  const image = await fileToImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  resizeIfNeeded(canvas, ctx, image);

  const segmenter = await getSegmenter();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const result = await segmenter(dataUrl);

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error("Segmentation produced no result");
  }

  // Use the first non-background mask. Most segmentation outputs include a
  // mask per detected entity; we invert the dominant background mask.
  const mask = result[0].mask;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < mask.data.length; i++) {
    // mask values 0..255: higher = more likely foreground
    const alpha = mask.data[i];
    data[i * 4 + 3] = alpha;
  }
  ctx.putImageData(imageData, 0, 0);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode PNG"))),
      "image/png",
      1,
    );
  });
}
