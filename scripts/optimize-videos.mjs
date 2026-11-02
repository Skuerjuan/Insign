import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const concurrency = 6;
async function command(binary, args) {
  return (await run(binary, args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })).stdout;
}
async function probe(file) {
  return JSON.parse(await command("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]));
}
async function videoHash(file) {
  return (await command("ffmpeg", ["-v", "error", "-i", file, "-map", "0:v:0", "-c:v", "copy", "-f", "hash", "-hash", "sha256", "-"])).trim();
}
async function parallel(items, callback) {
  let index = 0;
  const result = new Array(items.length);
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const current = index++;
      result[current] = await callback(items[current], current);
    }
  }));
  return result;
}

const tracked = (await command("git", ["ls-files", "-z", "--", "public"]))
  .split("\0").filter((file) => file.endsWith(".mp4"));
let inspected = 0;
const videos = await parallel(tracked, async (file) => {
  const metadata = await probe(file);
  if (++inspected % 100 === 0) console.log(`Analizados ${inspected}/${tracked.length}`);
  return { file, metadata };
});
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "insign-videos-"));
let processed = 0;
const results = await parallel(videos, async ({ file, metadata }, index) => {
  const fullPath = path.join(root, file);
  const before = await fs.stat(fullPath);
  const streams = metadata.streams;
  const video = streams.find((stream) => stream.codec_type === "video");
  const base = { file, beforeBytes: before.size, afterBytes: before.size, optimized: false };
  // El recorrido de la landing tiene narración. Sus pistas y capítulos se conservan.
  if (file === "public/grabacion-insign.mp4" || !streams.some((stream) => stream.codec_type === "audio")) return base;
  if (streams.filter((stream) => stream.codec_type === "video").length !== 1) return base;
  const candidate = path.join(temporary, `${index}.mp4`);
  try {
    await command("ffmpeg", ["-v", "error", "-nostdin", "-y", "-copyts", "-i", fullPath,
      "-map", "0:v:0", "-c:v", "copy", "-an", "-map_metadata", "0", "-movflags", "+faststart", candidate]);
    const nextStat = await fs.stat(candidate);
    if (nextStat.size >= before.size) return base;
    const nextMetadata = await probe(candidate);
    const nextVideo = nextMetadata.streams.find((stream) => stream.codec_type === "video");
    const keys = ["codec_name", "width", "height", "pix_fmt", "sample_aspect_ratio", "r_frame_rate", "avg_frame_rate", "duration", "nb_frames", "color_range", "color_space", "color_transfer", "color_primaries"];
    for (const key of keys) {
      if (video[key] !== nextVideo[key]) throw new Error(`${file}: cambió ${key}`);
    }
    if (JSON.stringify(video.side_data_list ?? []) !== JSON.stringify(nextVideo.side_data_list ?? [])) {
      throw new Error(`${file}: cambió la orientación u otra información de la imagen`);
    }
    const originalHash = await videoHash(fullPath);
    if (originalHash !== await videoHash(candidate)) throw new Error(`${file}: cambió la pista de video`);
    const currentStat = await fs.stat(fullPath);
    if (currentStat.size !== before.size || currentStat.mtimeMs !== before.mtimeMs) {
      throw new Error(`${file}: el archivo cambió durante la optimización`);
    }
    await fs.copyFile(candidate, fullPath);
    if (++processed % 25 === 0) console.log(`Optimizados y verificados ${processed} clips`);
    return { ...base, afterBytes: nextStat.size, optimized: true, videoSha256: originalHash.replace("SHA256=", ""),
      width: video.width, height: video.height, frames: video.nb_frames, duration: video.duration };
  } finally {
    await fs.unlink(candidate).catch(() => {});
  }
});
await fs.rmdir(temporary);
const beforeBytes = results.reduce((total, row) => total + row.beforeBytes, 0);
const afterBytes = results.reduce((total, row) => total + row.afterBytes, 0);
const report = {
  method: "MP4 stream copy: imagen intacta; eliminación del audio que los juegos ya silencian; faststart para carga progresiva",
  filesInspected: results.length, filesOptimized: results.filter((row) => row.optimized).length,
  beforeBytes, afterBytes, savedBytes: beforeBytes - afterBytes,
  reductionPercent: Number(((1 - afterBytes / beforeBytes) * 100).toFixed(2)),
  presentationAudioPreserved: true,
  clips: results.filter((row) => row.optimized),
};
await fs.mkdir(path.join(root, "output/media"), { recursive: true });
const reportPath = path.join(root, "output/media/video-optimization-report.json");
// Conservar la medición inicial si el proceso se repite y ya no queda audio para retirar.
if (report.filesOptimized > 0 || !await fs.stat(reportPath).catch(() => null)) {
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
}
console.log(JSON.stringify({ ...report, clips: undefined }));
