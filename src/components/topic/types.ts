export type SourceFilter = "all" | "wechat" | "xiaohongshu";

export interface TopicResult {
  id: string;
  title: string;
  source: "WeChat" | "Xiaohongshu";
  snippet: string;
  date: string;
  url: string;
}

export interface TopicAnalysis {
  summary: string;
  keyInsights: string[];
  contentAngles: string[];
  recommendedPlatforms: {
    name: string;
    reason: string;
  }[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const MOCK_RESULTS: TopicResult[] = [
  {
    id: "1",
    title: "2026 内容营销趋势盘点",
    source: "WeChat",
    snippet:
      "AI 生成内容正在重塑品牌社交媒体营销方式。个性化、数据驱动的策略在各平台加速落地。",
    date: "2026-05-28",
    url: "#",
  },
  {
    id: "2",
    title: "如何在小红书打造忠实粉丝群",
    source: "Xiaohongshu",
    snippet:
      "真实故事和社群互动仍是涨粉核心驱动力。投入 UGC 的品牌粉丝留存率高出 3 倍。",
    date: "2026-05-27",
    url: "#",
  },
  {
    id: "3",
    title: "微信小程序：下一个电商主战场",
    source: "WeChat",
    snippet:
      "预计到 2026 年 Q4，小程序将承载超过 50% 的社交电商交易。先行者已看到显著 ROI 提升。",
    date: "2026-05-25",
    url: "#",
  },
  {
    id: "4",
    title: "小红书创作者短视频策略指南",
    source: "Xiaohongshu",
    snippet:
      "60 秒以内的短视频互动率是长视频的 2.5 倍。以下是本月最火的剪辑技巧。",
    date: "2026-05-24",
    url: "#",
  },
  {
    id: "5",
    title: "AI 客服在微信上的崛起",
    source: "WeChat",
    snippet:
      "企业微信 AI 客服采用率同比增长 40%。早期采用品牌的客户满意度全面提升。",
    date: "2026-05-22",
    url: "#",
  },
  {
    id: "6",
    title: "美妆品牌小红书运营案例精选",
    source: "Xiaohongshu",
    snippet:
      "三个美妆品牌通过 KOL 合作和产品种草，月 GMV 翻倍增长。",
    date: "2026-05-20",
    url: "#",
  },
];

export const MOCK_ANALYSIS: TopicAnalysis = {
  summary:
    "该话题反映了 AI 驱动内容策略在中国社交平台上的重要性日益增长。微信和小红书都在快速迭代，新工具和功能奖励先行者。将真实故事与数据驱动优化相结合的品牌正在超越竞争对手。",
  keyInsights: [
    "AI 生成内容的采用正在加速，但人工审核对品牌调性一致性仍然至关重要。",
    "短视频（60 秒以内）是 2026 年小红书互动率最高的内容形式。",
    "微信小程序正在成为主要电商渠道，而不仅仅是补充渠道。",
    "UGC 驱动的活动粉丝留存率比品牌自制内容高出 3 倍。",
  ],
  contentAngles: [
    "教程：如何为微信公众号搭建 AI 内容工作流。",
    "对比文章：微信 vs 小红书 —— 2026 年哪个平台更适合你的品牌？",
    "案例集锦：本季度小红书运营最出色的 5 个品牌。",
    "观点文：AI 内容时代，为什么人的创造力仍然重要。",
  ],
  recommendedPlatforms: [
    {
      name: "微信公众号",
      reason: "长文形式适合思想领导力和深度分析类内容。",
    },
    {
      name: "小红书",
      reason: "视觉优先的形式适合教程、信息图和产品相关内容。",
    },
    {
      name: "Twitter / X",
      reason: "适合引发讨论并将流量引导至长文内容。",
    },
  ],
};
