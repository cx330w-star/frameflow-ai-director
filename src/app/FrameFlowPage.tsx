"use client";

import { sitePath } from "../lib/site-path";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnalysisResult, createTemplateResult, exportPromptText, ImageAnalysis, MediaMode, syncPrompts, validateModelResult, Version, VideoSegment } from "../lib/frameflow";
import { captureVideoFrames, checkUpload, prepareImage } from "../lib/media";
import "./director-colors.css";

type UploadItem = { id: string; file: File; url: string };
type UploadZoneProps = {
  label: string; note: string; items: UploadItem[]; multiple?: boolean; video?: boolean;
  onFiles: (files: File[]) => void; onRemove: (id: string) => void;
};
const analysisLabels: Record<keyof ImageAnalysis, string> = { subject: "主体", scene: "场景", style: "风格", palette: "色彩", composition: "构图", lighting: "光线", camera: "镜头", texture: "质感", negative: "负面约束" };
const DRAFT_KEY = "frameflow-text-draft-v3";

function UploadZone({ label, note, items, multiple = true, video = false, onFiles, onRemove }: UploadZoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const drop = (event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); if (!input.current?.disabled && !input.current?.closest("fieldset")?.disabled) onFiles(Array.from(event.dataTransfer.files)); };
  return <div>
    <label className="drop-zone" onDragOver={(e) => e.preventDefault()} onDrop={drop}>
      <input ref={input} aria-label={label} type="file" accept={video ? "video/mp4,video/webm,video/quicktime" : "image/png,image/jpeg,image/webp"} multiple={multiple} onChange={(e) => { onFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
      <span className="drop-icon" aria-hidden="true">{video ? "▶" : "+"}</span><strong>{label}</strong><small>{note}</small>
    </label>
    {items.length > 0 && <div className={`preview-grid ${video ? "single" : ""}`}>
      {items.map((item) => <figure className="preview-card" key={item.id}>
        {video ? <video src={item.url} controls preload="metadata" /> : <img src={item.url} alt={item.file.name} />}
        <figcaption title={item.file.name}>{item.file.name}</figcaption>
        <button type="button" aria-label={`移除 ${item.file.name}`} onClick={() => onRemove(item.id)}>×</button>
      </figure>)}
    </div>}
  </div>;
}

export default function FrameFlowPage({ version }: { version: Version }) {
  const [mode, setMode] = useState<MediaMode>("image");
  const [references, setReferences] = useState<UploadItem[]>([]);
  const [video, setVideo] = useState<UploadItem[]>([]);
  const [products, setProducts] = useState<UploadItem[]>([]);
  const [frames, setFrames] = useState<string[]>([]);
  const [productName, setProductName] = useState("");
  const [appearance, setAppearance] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [visualBrief, setVisualBrief] = useState("");
  const configured = false;
  const [configChecked, setConfigChecked] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [productBusy, setProductBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState("");
  const [dirty, setDirty] = useState(false);
  const [demo, setDemo] = useState(false);
  const urls = useRef(new Set<string>());
  const demoRequested = useRef(false);
  const output = useRef<HTMLElement>(null);
  const inputLocked = busy || productBusy;

  useEffect(() => {
    // This distribution is a browser-local demo; no hosted API is requested.
    setConfigChecked(true);
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (draft && typeof draft === "object") {
        if (typeof draft.productName === "string") setProductName(draft.productName.slice(0, 6000));
        if (typeof draft.appearance === "string") setAppearance(draft.appearance.slice(0, 6000));
        if (typeof draft.sellingPoints === "string") setSellingPoints(draft.sellingPoints.slice(0, 6000));
        if (typeof draft.visualBrief === "string") setVisualBrief(draft.visualBrief.slice(0, 6000));
      }
    } catch { /* Storage can be disabled; the workspace still works. */ }
    setDraftReady(true);
    const registry = urls.current;
    return () => { registry.forEach((url) => URL.revokeObjectURL(url)); registry.clear(); };
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ productName, appearance, sellingPoints, visualBrief })); } catch { /* Optional browser-local draft. */ }
  }, [draftReady, productName, appearance, sellingPoints, visualBrief]);

  useEffect(() => {
    if (!status || busy || productBusy) return;
    const timer = window.setTimeout(() => setStatus(""), 6500);
    return () => clearTimeout(timer);
  }, [status, busy, productBusy]);

  const outputKinds = useMemo(() => version === "v1" ? "图片提示词 + 8 秒视频分镜" : mode === "image" ? "图片拆解与生图提示词" : "8 秒视频分镜与即梦提示词", [mode, version]);
  const changed = () => { setDirty(true); setDemo(false); setStatus(""); };
  const itemFor = (file: File): UploadItem => {
    const url = URL.createObjectURL(file); urls.current.add(url);
    return { id: crypto.randomUUID(), file, url };
  };
  const release = (item: UploadItem) => { URL.revokeObjectURL(item.url); urls.current.delete(item.url); };
  const addItems = (files: File[], kind: "references" | "products" | "video") => {
    if (inputLocked) return;
    const isVideo = kind === "video";
    const current = isVideo ? video : kind === "references" ? references : products;
    const max = isVideo ? 1 : kind === "references" ? 6 : 4;
    const messages: string[] = [];
    const valid = files.filter((file) => { const issue = checkUpload(file, isVideo); if (issue) messages.push(issue); return !issue; });
    const room = isVideo ? 1 : Math.max(0, max - current.length);
    if (valid.length > room) messages.push(`最多 ${max} 个文件，超出部分未添加。`);
    const accepted = valid.slice(0, room).map(itemFor);
    if (accepted.length) {
      if (isVideo) { current.forEach(release); setVideo(accepted); setFrames([]); }
      else if (kind === "references") setReferences([...current, ...accepted]);
      else setProducts([...current, ...accepted]);
      changed();
    }
    setError(messages.join(" "));
  };
  const removeItem = (id: string, kind: "references" | "products" | "video") => {
    const current = kind === "video" ? video : kind === "references" ? references : products;
    const target = current.find((item) => item.id === id); if (target) release(target);
    const next = current.filter((item) => item.id !== id);
    if (kind === "video") { setVideo(next); setFrames([]); }
    else if (kind === "references") setReferences(next); else setProducts(next);
    changed();
  };
  const template = (source: "template" | "fallback" = "template") => createTemplateResult({ version, mode, productName, appearance, sellingPoints, visualBrief, source });
  const revealOutput = () => { window.setTimeout(() => output.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); };

  const loadDemo = async () => {
    setBusy(true); setError("");
    try {
      const getFile = async (path: string, name: string) => {
        const r = await fetch(path); if (!r.ok) throw new Error("演示素材加载失败，请重试。");
        const source = new File([await r.blob()], name, { type: "image/svg+xml" });
        const jpeg = await prepareImage(source);
        const blob = await (await fetch(jpeg)).blob();
        return new File([blob], name.replace(".svg", ".jpg"), { type: "image/jpeg" });
      };
      const [ref, product] = await Promise.all([getFile(sitePath("/demo/reference-scene.svg"), "参考场景-示意.svg"), getFile(sitePath("/demo/product.svg"), "虚构产品-MORI-示意.svg")]);
      [...references, ...products].forEach(release);
      setReferences([itemFor(ref)]); setProducts([itemFor(product)]); setMode("image"); setFrames([]);
      const sample = { productName: "MORI 植萃喷雾（虚构产品）", sellingPoints: "细腻喷雾、清爽使用感", appearance: "绿色半透明圆角长瓶，深绿色短盖，正面米白色矩形标签，MORI 字样居中，容量 120 ml。", visualBrief: "冷蓝色背景，半透明几何台座，产品居中偏左，右侧留白；右上方柔和侧逆光，浅景深与干净高光。" };
      setProductName(sample.productName); setSellingPoints(sample.sellingPoints); setAppearance(sample.appearance); setVisualBrief(sample.visualBrief);
      setResult(createTemplateResult({ version, mode: "image", ...sample })); setDirty(false); setDemo(true);
      setStatus("演示已载入：插画素材与虚构品牌，仅展示工作流；结果为人工预填信息生成的模板。无需调用模型。"); revealOutput();
    } catch (e) { setError(e instanceof Error ? e.message : "演示载入失败。"); }
    finally { setBusy(false); }
  };

  const analyze = async () => {
    if (!(mode === "image" ? references.length : video.length)) { setError(`请先添加${mode === "image" ? "参考图片" : "参考视频"}，或载入演示。`); return; }
    if (!productName.trim() || !appearance.trim()) { setError("请填写产品名称与产品视觉档案，明确需要保持的产品特征。"); return; }
    if (!configured && !visualBrief.trim()) { setError("本地模板不会识别画面，请先填写参考画面说明。"); return; }
    setBusy(true); setError(""); setStatus(mode === "video" ? "正在解码视频并抽取三帧…" : "正在准备导演方案…"); setResult(null);
    const controller = new AbortController();
    let timer: number | undefined;
    let decodedFrames: string[] = [];
    try {
      const videoFrames = mode === "video" ? await captureVideoFrames(video[0].file) : [];
      decodedFrames = videoFrames;
      setFrames(videoFrames);
      if (!configured) { setResult(template()); setStatus("本地草案已生成，请人工检查后使用。"); setDirty(false); revealOutput(); return; }
      const referenceImages = mode === "image" ? await Promise.all(references.map((item) => prepareImage(item.file))) : [];
      const productImages = await Promise.all(products.map((item) => prepareImage(item.file)));
      setStatus("正在请求模型分析，请稍候…");
      timer = window.setTimeout(() => controller.abort(), 70000);
      const response = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify({ task: "analyze", version, mode, productName, appearance, sellingPoints, visualBrief, referenceImages, videoFrames, productImages }) });
      const data = await response.json() as { error?: unknown; source?: unknown } | null;
      if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : `请求失败（${response.status}）`);
      setResult(data?.source === "template" ? template() : validateModelResult(data, version, mode));
      setStatus(data?.source === "template" ? "模型未配置，已生成本地模板草案。" : "分析完成，请核对并编辑导演方案。");
      setDirty(false); revealOutput();
    } catch (e) {
      setError(e instanceof Error && e.name === "AbortError" ? "分析超时，已生成模板草案。" : e instanceof Error ? e.message : "分析失败。");
      // Decoding errors are actionable input errors, not successful analysis.
      if (configured && (mode === "image" || decodedFrames.length)) { setResult(template("fallback")); setDirty(false); revealOutput(); }
      setStatus("");
    } finally { clearTimeout(timer); setBusy(false); }
  };

  const recognizeProduct = async () => {
    if (!configured) { setStatus("模板模式无法识别图片。请手动描述外形、材质、标签位置和品牌色。"); return; }
    if (!products.length) { setError("请先添加至少一张产品资产图。"); return; }
    setProductBusy(true); setError("");
    const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), 70000);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify({ task: "product-profile", version, mode, productName, productImages: await Promise.all(products.map((item) => prepareImage(item.file))) }) });
      const data = await response.json() as { error?: unknown } | null; if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "产品识别请求失败。");
      const profile = validateModelResult(data, version, mode, true).productProfile!;
      setAppearance(profile.appearance); setDirty(true); setStatus("产品档案已更新，请核对后重新生成方案。");
    } catch (e) { setError(e instanceof Error ? e.message : "产品识别失败。"); }
    finally { clearTimeout(timer); setProductBusy(false); }
  };

  const updateAnalysis = (key: keyof ImageAnalysis, value: string) => setResult((current) => current?.imageAnalysis ? { ...current, imageAnalysis: { ...current.imageAnalysis, [key]: value } } : current);
  const updateSegment = (index: number, key: keyof VideoSegment, value: string) => setResult((current) => current?.videoSegments ? { ...current, videoSegments: current.videoSegments.map((s, i) => i === index ? { ...s, [key]: value } : s) } : current);
  const copyText = async (label: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(label); setStatus("已复制到剪贴板。"); window.setTimeout(() => setCopied(""), 1600); }
    catch { setError("浏览器未允许复制，请手动选择文本，或下载方案 TXT。"); }
  };
  const download = (format: "json" | "txt") => {
    if (!result) return;
    const blob = new Blob([format === "json" ? JSON.stringify(result, null, 2) : exportPromptText(result)], { type: format === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `frameflow-${result.version}-${result.mode}.${format}`; document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); setStatus(`已导出 ${format.toUpperCase()} 方案。`);
  };
  const changeMode = (next: MediaMode) => { setMode(next); setResult(null); setDirty(false); setError(""); setStatus(""); setDemo(false); };

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1" && !demoRequested.current) {
      demoRequested.current = true;
      void loadDemo();
    }
  }, []);

  return <main className="app-shell director-shell">
    <header className="topbar">
      <a className="brand" href={sitePath("/")}><span className="brand-mark">F</span><span><b>FrameFlow</b><small>AI 导演台</small></span></a>
      <nav aria-label="版本切换"><a className={version === "v1" ? "active" : ""} href={sitePath("/")} aria-current={version === "v1" ? "page" : undefined}>全量方案</a><a className={version === "v2" ? "active" : ""} href={sitePath("/v2/")} aria-current={version === "v2" ? "page" : undefined}>按模式生成</a><a href={sitePath("/case-study/")}>项目介绍</a></nav>
      <div className={`model-state ${configured ? "online" : "offline"}`}><span />{!configChecked ? "检查连接中" : configured ? "AI 分析已连接" : "本地模板模式"}</div>
    </header>
    <section className="hero">
      <div className="hero-meta">FRAMEFLOW / SCENE · STYLE · LIGHT · MOVEMENT</div>
      <div className="eyebrow">电商 AI 素材工作流 · 可交互原型</div>
      <h1>把参考画面，变成<span>可执行的生成指令。</span></h1>
      <p>把参考的视觉语言与产品外观分开约束，整理成可编辑的图片提示词和 8 秒视频分镜。</p>
      <div className="hero-actions"><a className="launch-button" href="#workspace">进入工作台</a><button className="hero-demo" disabled={inputLocked} onClick={loadDemo}>载入演示案例</button></div>
      <div className="flow-line"><b>工作流</b><span>参考素材 + 产品档案 → 导演方案 → 人工校对 → 外部生成工具</span></div>
    </section>
    <section className="workspace" id="workspace">
      <div className="workspace-heading"><div><small>DIRECTOR WORKSPACE</small><h2>创建导演方案</h2></div><span>{version === "v1" ? "全量输出图片与视频方案" : "仅输出当前模式方案"}</span></div>
      <div className="mode-notice"><strong>{configured ? "AI 辅助分析" : "本地模板模式"}</strong><span>{configured ? "所选参考图、视频抽帧与产品图会发送给已配置的模型服务；生成结果仍需人工核对。" : "当前未连接视觉模型。模板依据你填写的文字生成，不会识别上传画面，也不会生成图片或视频。"}</span></div>
      <fieldset className="input-column" disabled={inputLocked}>
        <legend className="sr-only">导演方案输入</legend>
        <article className="glass-card"><div className="card-heading"><span className="step">01</span><div><h2>参考素材</h2><p>只提取场景、风格、构图、光线与镜头语言</p></div></div>
          <div className="mode-tabs" role="group" aria-label="参考素材模式"><button aria-pressed={mode === "image"} className={mode === "image" ? "active" : ""} onClick={() => changeMode("image")}>图片参考</button><button aria-pressed={mode === "video"} className={mode === "video" ? "active" : ""} onClick={() => changeMode("video")}>视频参考</button></div>
          {mode === "image" ? <UploadZone label="拖放或选择参考图片" note="PNG / JPG / WEBP · 最多 6 张 · 单张不超过 8 MB" items={references} onFiles={(f) => addItems(f, "references")} onRemove={(id) => removeItem(id, "references")} /> : <UploadZone label="拖放或选择参考视频" note="MP4 / WEBM / MOV · 最大 100 MB · 浏览器需能解码" multiple={false} video items={video} onFiles={(f) => addItems(f, "video")} onRemove={(id) => removeItem(id, "video")} />}
          {mode === "video" && <p className="field-help">生成时在时长 12% / 50% / 88% 处抽取三帧，仅用于视觉参考，不分析音频或精准切镜。</p>}
          {frames.length > 0 && <div className="frame-strip">{frames.map((frame, i) => <figure key={i}><img src={frame} alt={`视频 ${[12, 50, 88][i]}% 位置的抽帧`} /><figcaption>{[12, 50, 88][i]}% 关键帧</figcaption></figure>)}</div>}
          <label className="brief-field"><span>参考画面说明{!configured && "（模板模式必填）"}</span><textarea maxLength={6000} value={visualBrief} onChange={(e) => { setVisualBrief(e.target.value); changed(); }} placeholder="例如：冷蓝色背景，产品居中偏左，右侧留白，柔和侧逆光，镜头缓慢推进。" /></label>
        </article>
        <article className="glass-card"><div className="card-heading"><span className="step">02</span><div><h2>产品资产</h2><p>约束你的产品外形、包装与品牌识别</p></div></div>
          <div className="form-grid"><label><span>产品名称（必填）</span><input maxLength={6000} value={productName} onChange={(e) => { setProductName(e.target.value); changed(); }} placeholder="例如：MORI 植萃喷雾" /></label><label><span>核心卖点</span><input maxLength={6000} value={sellingPoints} onChange={(e) => { setSellingPoints(e.target.value); changed(); }} placeholder="填写可观察、可验证的产品特点" /></label><label className="wide"><span>产品视觉档案（必填，可手动填写）</span><textarea maxLength={6000} value={appearance} onChange={(e) => { setAppearance(e.target.value); changed(); }} placeholder="外形、包装比例、材质、标签位置、品牌色……" /></label></div>
          <UploadZone label="添加多角度产品图" note="正面、侧面、背面或细节 · 最多 4 张 · 单张不超过 8 MB" items={products} onFiles={(f) => addItems(f, "products")} onRemove={(id) => removeItem(id, "products")} />
          <button className="secondary-button" disabled={!configured || productBusy} onClick={recognizeProduct}>{productBusy ? "正在识别…" : configured ? "AI 识别产品外观" : "产品外观识别需连接视觉模型"}</button>
          <p className="field-help">文字草稿仅保存在此浏览器。刷新或切换版本后，文件需重新选择。</p>
        </article>
        <article className="launch-card"><div><small>本次产物</small><strong>{outputKinds}</strong></div><button className="launch-button" disabled={!configChecked || busy} onClick={analyze}>{busy ? <><span className="spinner" />正在处理素材</> : configured ? "开始导演分析" : "生成模板草案"}</button><p>{configured ? "AI 分析将发送所选素材。请在使用前确认你愿意提供这些素材。" : "模板在浏览器中运行，上传素材仅用于本地预览。"}</p></article>
      </fieldset>
      <aside className="output-column" ref={output} aria-label="导演输出">
        <div className="output-sticky"><div className="output-heading"><div><small>DIRECTOR OUTPUT</small><h2>导演输出</h2></div>{result && <span className={`source-badge ${result.source}`}>{result.source === "ai" ? "AI 辅助分析" : result.source === "fallback" ? "失败回退 · 模板" : "模板草案"}</span>}</div>
          {!result ? <div className="empty-output"><div className="radar" aria-hidden="true"><span /><span /><span /><b>+</b></div><h3>{busy ? "正在整理方案" : "从一个参考画面开始"}</h3><p>添加素材并填写产品档案，或直接载入演示案例查看完整流程。</p><button className="secondary-button" disabled={inputLocked} onClick={loadDemo}>载入演示案例</button></div> : <div className="result-stack">
            {dirty && <div className="notice stale" role="status">输入已修改，以下仍是上次方案。请重新生成，避免导出旧内容。</div>}
            {demo && <div className="notice">演示素材为插画与虚构品牌，非真实拍摄或客户案例。</div>}
            {result.notice && <div className="notice">{result.notice}</div>}
            {result.productProfile && <section className="result-panel compact"><h3>产品一致性约束</h3><p>{result.productProfile.appearance}</p><ul>{result.productProfile.constraints.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}
            {result.imageAnalysis && <section className="result-panel"><div className="panel-title"><h3>图片视觉拆解</h3><span>可人工编辑</span></div><div className="analysis-grid">{(Object.keys(analysisLabels) as (keyof ImageAnalysis)[]).map((key) => <label key={key}><span>{analysisLabels[key]}</span><textarea value={result.imageAnalysis?.[key] || ""} onChange={(e) => updateAnalysis(key, e.target.value)} /></label>)}</div></section>}
            {result.imagePrompt && <section className="result-panel prompt-panel"><div className="panel-title"><h3>图片提示词</h3><button onClick={() => copyText("image", result.imagePrompt!)}>{copied === "image" ? "已复制" : "复制图片提示词"}</button></div><textarea aria-label="图片提示词" value={result.imagePrompt} onChange={(e) => setResult({ ...result, imagePrompt: e.target.value })} /></section>}
            {result.videoSegments && <section className="result-panel"><div className="panel-title"><h3>8 秒视频分镜</h3><span>三段结构</span></div><div className="timeline">{result.videoSegments.map((segment, index) => <article key={segment.time}><time>{segment.time}</time>{(["shot", "motion", "performance"] as const).map((key) => <label key={key}><span>{key === "shot" ? "镜头" : key === "motion" ? "运动" : "表演 / 物理"}</span><textarea aria-label={`${segment.time} ${key === "shot" ? "镜头" : key === "motion" ? "运动" : "表演 / 物理"}`} value={segment[key]} onChange={(e) => updateSegment(index, key, e.target.value)} /></label>)}</article>)}</div></section>}
            {result.videoPrompt && <section className="result-panel prompt-panel"><div className="panel-title"><h3>即梦视频提示词</h3><button onClick={() => copyText("video", result.videoPrompt!)}>{copied === "video" ? "已复制" : "复制视频提示词"}</button></div><textarea aria-label="即梦视频提示词" value={result.videoPrompt} onChange={(e) => setResult({ ...result, videoPrompt: e.target.value })} /></section>}
            <button className="secondary-button" disabled={dirty} onClick={() => { setResult(syncPrompts(result, productName, sellingPoints, visualBrief)); setStatus("已将视觉拆解与分镜修改同步至提示词；原提示词已替换。"); }}>用当前拆解与分镜重建提示词</button>
            <p className="field-help">修改拆解或分镜后，点击上方按钮同步；重建会替换直接编辑的提示词。</p>
            <div className="result-actions"><button disabled={dirty} onClick={() => copyText("all", exportPromptText(result))}>{copied === "all" ? "已复制全部方案" : "复制全部方案"}</button><button disabled={dirty} onClick={() => download("json")}>导出 JSON</button><button disabled={dirty} className="primary" onClick={() => download("txt")}>下载方案 TXT</button></div>
          </div>}
        </div>
      </aside>
      <div className="workspace-feedback">{error && <div className="error-banner" role="alert">{error}</div>}<p role="status" aria-live="polite" className="status-message">{status}</p></div>
    </section>
    <footer><span>FRAMEFLOW / AI DIRECTOR CONSOLE</span><p>参考决定语言 · 产品决定外观 · 人工保留最终判断</p><a href={sitePath("/case-study/")}>查看项目介绍</a></footer>
  </main>;
}
