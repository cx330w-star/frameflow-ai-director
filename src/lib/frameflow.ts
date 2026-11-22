export type Version = "v1" | "v2";
export type MediaMode = "image" | "video";
export type ResultSource = "template" | "ai" | "fallback";

export type ImageAnalysis = {
  subject: string;
  scene: string;
  style: string;
  palette: string;
  composition: string;
  lighting: string;
  camera: string;
  texture: string;
  negative: string;
};

export type VideoSegment = {
  time: "0–2 秒" | "2–5 秒" | "5–8 秒";
  shot: string;
  motion: string;
  performance: string;
};

export type ProductProfile = {
  appearance: string;
  constraints: string[];
};

export type AnalysisResult = {
  source: ResultSource;
  version: Version;
  mode: MediaMode;
  imageAnalysis?: ImageAnalysis;
  imagePrompt?: string;
  videoSegments?: VideoSegment[];
  videoPrompt?: string;
  productProfile?: ProductProfile;
  notice?: string;
};

export type TemplateInput = {
  version: Version;
  mode: MediaMode;
  productName?: string;
  appearance?: string;
  sellingPoints?: string;
  source?: ResultSource;
  visualBrief?: string;
};

const clean = (value: string | undefined, fallback: string) =>
  value?.trim() || fallback;

export function createTemplateResult(input: TemplateInput): AnalysisResult {
  const productName = clean(input.productName, "用户产品");
  const appearance = clean(
    input.appearance,
    "严格依据产品资产保持外形、包装比例、材质、标签位置与品牌色",
  );
  const sellingPoints = clean(
    input.sellingPoints,
    "突出核心质感、使用体验与清晰的产品记忆点",
  );
  const wantsImage = input.version === "v1" || input.mode === "image";
  const wantsVideo = input.version === "v1" || input.mode === "video";
  const result: AnalysisResult = {
    source: input.source ?? "template",
    version: input.version,
    mode: input.mode,
    productProfile: {
      appearance,
      constraints: [
        "保持产品轮廓和包装比例一致",
        "保持材质、高光与透明度关系一致",
        "保持标签位置、文字方向与品牌色一致",
        "不继承参考素材中原产品的品牌、外形或包装",
      ],
    },
    notice:
      input.source === "fallback"
        ? "AI 请求未完成，当前结果为模板草案，未完成视觉识别。失败前素材可能已发送至模型服务，请人工核对。"
        : "当前为本地模板草案，不会识别上传画面。请填写参考画面说明、人工修改后使用；素材不会上传。",
  };

  if (wantsImage) {
    result.imageAnalysis = {
      subject: "提取参考素材中的主体层级与视觉焦点，不复用其中的品牌或产品身份",
      scene: clean(input.visualBrief, "待人工填写：参考素材的空间关系、背景层次与环境气氛"),
      style: "商业广告级写实质感，细节克制，避免廉价生成感",
      palette: "沿用参考素材的主色、辅助色与冷暖对比，产品品牌色保持准确",
      composition: "保持参考画面的主体占比、留白、视觉动线与前中后景层次",
      lighting: "复刻主光方向、光比、边缘光与高光形态，产品标签清晰可读",
      camera: "根据参考画面匹配景别、机位、焦段与景深关系",
      texture: "保留玻璃、金属、液体、皮肤或织物的真实微观质感",
      negative: "畸变包装、错误文字、额外瓶盖、重复产品、塑料感皮肤、过曝、脏污高光",
    };
    result.imagePrompt = `${productName} 商业产品广告画面。参考画面说明：${clean(input.visualBrief, "依据所附参考素材，人工确认场景与构图")}。以参考素材为视觉语言依据，复刻其场景层次、构图、色彩、光线、机位与质感；仅用产品资产约束待植入产品：${appearance}。画面重点：${sellingPoints}。产品轮廓、包装比例、材质、标签位置和品牌色必须稳定一致，标签正向、结构完整；参考素材中的原产品不得被误认为用户产品。商业摄影，真实材质，干净高光，细节锐利，自然景深。负面约束：畸变、错字、伪标识、重复部件、低清晰度、过度磨皮、廉价塑料感。`;
  }

  if (wantsVideo) {
    result.videoSegments = [
      {
        time: "0–2 秒",
        shot: `首帧即出现清晰视觉钩子，${productName} 保持可识别但不遮挡场景重点`,
        motion: "镜头轻推或主体快速进入稳定构图，运动有明确起点与制动",
        performance: "动作干净、克制，产品标签朝向镜头，建立第一记忆点",
      },
      {
        time: "2–5 秒",
        shot: "进入核心展示段，强化参考素材的空间、光线与镜头语言",
        motion: "使用连续的弧线运镜或顺滑跟随，避免无目的漂移和瞬移",
        performance: `通过可观察动作呈现卖点：${sellingPoints}`,
      },
      {
        time: "5–8 秒",
        shot: `${productName} 英雄镜头收口，包装正面清晰，画面保留品牌呼吸空间`,
        motion: "镜头减速并稳定停住，光线扫过产品关键材质后自然落定",
        performance: "产品结构全程一致，以明确结束姿态形成可剪辑的收尾帧",
      },
    ];
    result.videoPrompt = `8 秒竖屏商业广告，严格分为三段。参考画面说明：${clean(input.visualBrief, "依据所附参考素材人工确认")}。0–2 秒：首帧用视觉钩子建立场景与主体，镜头快速但可控地进入构图，${productName} 包装清晰。2–5 秒：延续参考素材的场景、构图、色彩、主光方向和镜头节奏，通过连续真实的物理运动呈现“${sellingPoints}”。5–8 秒：镜头减速进入产品英雄特写，标签正向清晰，光线扫过材质并稳定停住。产品一致性约束：${appearance}。全程保持产品轮廓、包装比例、材质、标签位置与品牌色不变；无变形、无重复部件、无漂浮穿模、无文字闪烁、无突兀转场。`;
  }

  return result;
}

const imageKeys = ["subject", "scene", "style", "palette", "composition", "lighting", "camera", "texture", "negative"] as const;
const times = ["0–2 秒", "2–5 秒", "5–8 秒"] as const;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === "string" && !!value.trim() && value.length <= 12000;

// Validate external output before it reaches editable UI. Only keep the requested mode.
export function validateModelResult(value: unknown, version: Version, mode: MediaMode, profileOnly = false): AnalysisResult {
  if (!isRecord(value) || !isRecord(value.productProfile)) throw new Error("模型缺少产品档案");
  const profile = value.productProfile;
  if (!nonempty(profile.appearance) || !Array.isArray(profile.constraints) || profile.constraints.length > 20 || !profile.constraints.every(nonempty)) {
    throw new Error("模型产品档案格式不完整");
  }
  const result: AnalysisResult = {
    source: "ai", version, mode,
    productProfile: { appearance: profile.appearance, constraints: profile.constraints as string[] },
    notice: "AI 辅助分析结果，请人工核对画面、产品结构与文字。提示词约束不能保证生成结果一致。",
  };
  if (profileOnly) return result;
  if (version === "v1" || mode === "image") {
    if (!isRecord(value.imageAnalysis) || !imageKeys.every((key) => nonempty((value.imageAnalysis as Record<string, unknown>)[key])) || !nonempty(value.imagePrompt)) {
      throw new Error("模型图片分析格式不完整");
    }
    result.imageAnalysis = Object.fromEntries(imageKeys.map((key) => [key, (value.imageAnalysis as Record<string, unknown>)[key]])) as ImageAnalysis;
    result.imagePrompt = value.imagePrompt;
  }
  if (version === "v1" || mode === "video") {
    if (!Array.isArray(value.videoSegments) || value.videoSegments.length !== 3 || !nonempty(value.videoPrompt)) throw new Error("模型分镜格式不完整");
    result.videoSegments = value.videoSegments.map((segment: unknown, index) => {
      if (!isRecord(segment) || segment.time !== times[index] || ![segment.shot, segment.motion, segment.performance].every(nonempty)) throw new Error("模型分镜时段或内容不完整");
      return { time: times[index], shot: segment.shot as string, motion: segment.motion as string, performance: segment.performance as string };
    });
    result.videoPrompt = value.videoPrompt;
  }
  return result;
}

export function syncPrompts(result: AnalysisResult, productName: string, sellingPoints: string, visualBrief = ""): AnalysisResult {
  const next = { ...result };
  const product = `${productName.trim() || "用户产品"}；卖点：${sellingPoints.trim() || "以实际产品信息为准"}。产品外观：${result.productProfile?.appearance || "以产品资产为准"}。一致性约束：${result.productProfile?.constraints.join("；") || "保持外形、材质、标签和品牌色"}。`;
  if (result.imageAnalysis) next.imagePrompt = `${product}\n${imageKeys.map((key) => `${key}：${result.imageAnalysis?.[key]}`).join("\n")}\n只继承参考的视觉语言，不继承参考中原产品的品牌与包装。`;
  const visual = result.imageAnalysis ? `场景：${result.imageAnalysis.scene}；构图：${result.imageAnalysis.composition}；色彩：${result.imageAnalysis.palette}；光线：${result.imageAnalysis.lighting}。` : visualBrief;
  if (result.videoSegments) next.videoPrompt = `8 秒竖屏商业广告。${product}\n视觉依据：${visual || "依据所附参考素材人工确认场景与光线"}\n${result.videoSegments.map((segment) => `${segment.time}：镜头：${segment.shot}；运动：${segment.motion}；表演 / 物理：${segment.performance}。`).join("\n")}\n保持物理连续，无变形、穿模、文字闪烁或突兀转场。`;
  return next;
}

export function exportPromptText(result: AnalysisResult): string {
  return ["FrameFlow 导演方案", `版本：${result.version} / ${result.mode === "image" ? "图片参考" : "视频参考"}`, `来源：${result.source === "ai" ? "AI 辅助分析" : "模板草案（未完成视觉识别）"}`, result.notice,
    result.productProfile && `产品外观\n${result.productProfile.appearance}\n${result.productProfile.constraints.join("\n")}`,
    result.imageAnalysis && `视觉拆解\n${imageKeys.map((key) => `${key}：${result.imageAnalysis?.[key]}`).join("\n")}`,
    result.imagePrompt && `图片提示词\n${result.imagePrompt}`,
    result.videoSegments && `8 秒分镜\n${result.videoSegments.map((s) => `${s.time}\n镜头：${s.shot}\n运动：${s.motion}\n表演 / 物理：${s.performance}`).join("\n\n")}`,
    result.videoPrompt && `视频提示词\n${result.videoPrompt}`,
  ].filter(Boolean).join("\n\n");
}

