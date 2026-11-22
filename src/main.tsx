import { siteRoute } from "./lib/site-path";
import { createRoot } from "react-dom/client";
import FrameFlowPage from "./app/FrameFlowPage";
import CaseStudyPage from "./app/case-study/page";
import "./app/globals.css";

const path = siteRoute(window.location.pathname);
const root = document.getElementById("root");
if (!root) throw new Error("页面挂载点不存在");
createRoot(root).render(path === "/case-study" ? <CaseStudyPage /> : <FrameFlowPage version={path === "/v2" ? "v2" : "v1"} />);
