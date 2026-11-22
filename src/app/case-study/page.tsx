"use client";

import { sitePath } from "../../lib/site-path";

import { useState } from "react";

const introduction = "FrameFlow AI 导演台是一个面向电商 AI 素材制作的工作流原型。它把参考画面的场景、构图、光线与镜头语言，与目标产品的外形、材质和包装约束分开整理，输出可编辑、可复制和导出的图片提示词及 8 秒视频分镜。项目通过结构化输入、分模式输出和人工校对环节，让提示词准备过程更清晰、可复用。当前支持本地模板，并预留可配置的视觉模型分析接口；图片和视频仍需在外部工具中生成。";

export default function CaseStudyPage() {
  const [message, setMessage] = useState("");
  const copy = async () => {
    try { await navigator.clipboard.writeText(introduction); setMessage("项目介绍已复制，可用于作品集或面试材料。"); }
    catch { setMessage("浏览器未允许复制，可直接选择下方介绍文字复制。"); }
  };
  return <main className="app-shell case-shell">
    <header className="topbar">
      <a className="brand" href={sitePath("/")}><span className="brand-mark">F</span><span><b>FrameFlow</b><small>项目案例</small></span></a>
      <nav aria-label="网站导航"><a href={sitePath("/")}>全量方案</a><a href={sitePath("/v2/")}>按模式生成</a><a className="active" aria-current="page" href={sitePath("/case-study/")}>项目介绍</a></nav>
    </header>
    <section className="case-hero">
      <div className="case-kicker">PORTFOLIO / AI CREATIVE WORKFLOW</div>
      <h1>FrameFlow AI 导演台<span>把电商素材制作经验，整理成可复用的工作流。</span></h1>
      <p className="case-lead">从“有一张参考图”到“能交给生成工具执行的导演方案”，把视觉语言、产品约束和镜头节奏放在同一个工作台。</p>
      <div className="case-tags"><span>电商内容制作</span><span>提示词结构设计</span><span>交互原型</span><span>AI 辅助开发</span></div>
      <div className="case-controls"><a className="primary" href={sitePath("/?demo=1#workspace")}>体验示例工作流</a><button onClick={() => window.print()} style={{ color:"#fffef9", borderColor:"#a8c6c4" }}>打印 / 保存为 PDF</button></div>
      <p className="case-note">项目阶段：可交互工作流原型。当前演示为本地模板，未验证真实模型分析效果。</p>
    </section>
    <div className="case-content">
      <section className="case-section">
        <h2>起点：参考图好看，却不一定能直接用于自己的产品。</h2>
        <div className="case-grid">
          <article className="case-card"><h3>视觉描述容易遗漏</h3><p>只描述“高级感”难以执行。场景、构图、光线、景别和材质需要拆成明确字段。</p></article>
          <article className="case-card"><h3>参考与产品容易混淆</h3><p>需要借鉴参考的视觉语言，同时保留自己产品的外形、包装比例、标签位置与品牌色。</p></article>
          <article className="case-card"><h3>从静帧到视频需要节奏</h3><p>图片提示词不能直接替代分镜，需要写清镜头运动、主体动作与结束姿态。</p></article>
        </div>
      </section>
      <section className="case-section">
        <h2>核心设计：分开输入，在导演方案中汇合。</h2>
        <div className="workflow-strip"><div><b>参考素材</b><span>图片或视频三点抽帧，描述场景与镜头语言。</span></div><div><b>产品档案</b><span>单独填写产品特征，补充多角度图片。</span></div><div><b>导演方案</b><span>九维视觉拆解、提示词、三段视频分镜。</span></div><div><b>校对与交付</b><span>编辑、同步提示词，复制或导出给外部生成工具。</span></div></div>
        <p>全量模式同时给出图片与视频方案；按模式生成只展示当前任务需要的结果。模板与 AI 结果分别标注来源，人工保留最后的判断。</p>
      </section>
      <section className="case-section page-start">
        <h2>一个具体例子，比一页功能名称更有说服力。</h2>
        <div className="case-example">
          <figure><img src={sitePath("/demo/reference-scene.svg")} alt="冷蓝背景、半透明台座与侧光的参考场景插画" /><figcaption>参考场景：取构图、色彩与光线。</figcaption></figure>
          <figure><img src={sitePath("/demo/product.svg")} alt="虚构 MORI 绿色喷雾产品示意图" /><figcaption>目标产品：取瓶身、材质与标签。</figcaption></figure>
          <article className="case-card"><h3>生成的草案应写清楚</h3><p>冷蓝色背景、居中偏左构图、柔和侧逆光；产品仍为绿色半透明长瓶，深绿色短盖，米白标签居中。视频按 0–2、2–5、5–8 秒组织开场、展示与收尾。</p><strong>示例为插画与虚构品牌，非客户项目或生成成片。</strong></article>
        </div>
        <a className="case-demo-link" href={sitePath("/?demo=1#workspace")}>在工作台查看并编辑这个示例</a>
        <p className="case-note">此案例展示信息如何被组织成指令。生成图片、视频与产品一致性的实际效果，需要接入模型及外部生成工具后另行验证。</p>
      </section>
      <section className="case-section">
        <h2>作品集呈现重点：业务判断如何变成产品细节。</h2>
        <table className="case-table"><thead><tr><th>设计决策</th><th>可展示的实现</th><th>体现的能力</th></tr></thead><tbody>
          <tr><td>参考与产品分开约束</td><td>两类独立素材入口；模型请求中区分图片分组。</td><td>把素材制作问题转化为输入结构。</td></tr>
          <tr><td>从图像语言延伸到视频</td><td>九个视觉字段与 8 秒三段分镜，支持修改后重建提示词。</td><td>视觉拆解、镜头节奏与指令组织。</td></tr>
          <tr><td>明确自动化边界</td><td>模板来源标注、错误提示、模型响应校验与失败回退。</td><td>考虑真实使用中的异常与信任问题。</td></tr>
          <tr><td>让结果进入下一步制作</td><td>复制提示词、方案 TXT 与 JSON 导出、浏览器文字草稿。</td><td>从交互体验到可交付内容的完整流程。</td></tr>
        </tbody></table>
        <p className="case-note">实现方式：React + TypeScript + Vinext，借助 AI 编程工具完成开发与修复。适合强调工作流设计、需求表达、迭代和验证；个人职责请结合实际参与情况表述。</p>
      </section>
      <section className="case-section page-start">
        <h2>可直接使用的项目介绍</h2>
        <blockquote className="case-quote">{introduction}</blockquote>
        <div className="case-controls"><button className="primary" onClick={copy}>复制作品集介绍</button><button onClick={() => window.print()}>打印 / 保存为 PDF</button></div>
        <p className="case-status" role="status">{message}</p>
      </section>
      <section className="case-section">
        <h2>用三页案例，讲完整个项目。</h2>
        <div className="case-grid">
          <article className="case-card"><h3>项目与问题</h3><p>项目名称、一句话定位、素材制作中的三个问题，加一张工作台截图。写清项目阶段与自己的实际职责。</p></article>
          <article className="case-card"><h3>流程与演示</h3><p>用同一组参考图和产品图，展示输入、视觉拆解、提示词与分镜。配 45–60 秒录屏，演示修改和导出。</p></article>
          <article className="case-card"><h3>实现与反思</h3><p>说明全量 / 分模式输出、来源标注与失败回退等设计。补充验证记录、当前局限和下一步计划。</p></article>
        </div>
      </section>
      <section className="case-section">
        <h2>如实展示完成度，保留后续验证空间。</h2>
        <table className="case-table"><tbody>
          <tr><th scope="row">已实现</th><td>图片与视频输入、本地预览与抽帧、模板方案、结果编辑、复制导出、模型 API 调用与格式校验、失败回退。</td></tr>
          <tr><th scope="row">仍待验证</th><td>真实视觉模型下的分析质量、外部生成工具中的产品一致性、实际制作耗时与使用反馈。</td></tr>
          <tr><th scope="row">当前范围</th><td>不直接生成图片或视频；视频是三点抽帧与固定 8 秒分镜；没有音频理解、云端资产库或团队协作。</td></tr>
          <tr><th scope="row">下一步证据</th><td>用同一组真实素材对比人工准备与工具辅助准备的过程，记录耗时、修改点和生成效果，再补充结论。</td></tr>
        </tbody></table>
        <p className="case-note">尚无真实使用数据，不填写“效率提升百分比”“商业投放成果”或“自动保证产品一致”。对外投递可附截图、PDF 与录屏；在线演示需确认访问权限。</p>
      </section>
    </div>
    <footer><span>FRAMEFLOW / PORTFOLIO CASE STUDY</span><p>工作流设计 · 可交互原型 · AI 辅助开发</p><a href={sitePath("/")}>返回导演台</a></footer>
  </main>;
}
