export const imageTypes = ["image/png", "image/jpeg", "image/webp"];
export const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];

export function checkUpload(file: Pick<File, "type" | "size" | "name">, video = false): string | null {
  if (!(video ? videoTypes : imageTypes).includes(file.type)) return `${file.name} 格式不支持，请选择 ${video ? "MP4 / WEBM / MOV" : "PNG / JPG / WEBP"}。`;
  if (!file.size) return `${file.name} 是空文件。`;
  const max = video ? 100 : 8;
  if (file.size > max * 1024 * 1024) return `${file.name} 超过 ${max} MB。`;
  return null;
}

export async function prepareImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("图片解码超时，请重新选择素材。")), 12000);
      image.onload = () => { clearTimeout(timer); resolve(); };
      image.onerror = () => { clearTimeout(timer); reject(new Error(`无法读取 ${file.name}，请检查图片是否损坏。`)); };
      image.src = url;
    });
    const scale = Math.min(1, 1440 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("浏览器无法处理图片。");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally { URL.revokeObjectURL(url); }
}

export async function captureVideoFrames(file: File): Promise<string[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  const wait = (event: "loadeddata" | "seeked", action: () => void) => new Promise<void>((resolve, reject) => {
    const done = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error("无法解码视频，请转为 H.264 MP4 后重试。")); };
    const timer = window.setTimeout(() => { cleanup(); reject(new Error("视频抽帧超时，请尝试较短的 H.264 MP4 视频。")); }, 15000);
    const cleanup = () => { clearTimeout(timer); video.removeEventListener(event, done); video.removeEventListener("error", fail); };
    video.addEventListener(event, done, { once: true });
    video.addEventListener("error", fail, { once: true });
    action();
  });
  try {
    await wait("loadeddata", () => { video.src = url; video.load(); });
    if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) throw new Error("视频时长或尺寸无效，请重新导出视频。");
    const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("浏览器不支持视频抽帧。");
    const frames: string[] = [];
    for (const ratio of [0.12, 0.5, 0.88]) {
      const time = Math.min(Math.max(0, video.duration - 0.001), video.duration * ratio);
      if (Math.abs(time - video.currentTime) > 0.0001) await wait("seeked", () => { video.currentTime = time; });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.82));
    }
    return frames;
  } finally { video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url); }
}
