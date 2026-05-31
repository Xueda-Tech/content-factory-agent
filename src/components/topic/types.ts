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
    title: "2026 Content Marketing Trends You Need to Know",
    source: "WeChat",
    snippet:
      "AI-generated content is reshaping how brands approach social media marketing. The shift towards personalized, data-driven strategies is accelerating across platforms.",
    date: "2026-05-28",
    url: "#",
  },
  {
    id: "2",
    title: "How to Build a Loyal Audience on Xiaohongshu",
    source: "Xiaohongshu",
    snippet:
      "Authentic storytelling and community engagement remain the top drivers of follower growth. Brands that invest in UGC see 3x higher retention rates.",
    date: "2026-05-27",
    url: "#",
  },
  {
    id: "3",
    title: "WeChat Mini Programs: The Next E-Commerce Frontier",
    source: "WeChat",
    snippet:
      "Mini programs are projected to handle over 50% of social commerce transactions by Q4 2026. Early adopters are seeing significant ROI improvements.",
    date: "2026-05-25",
    url: "#",
  },
  {
    id: "4",
    title: "Short-Form Video Strategy for Xiaohongshu Creators",
    source: "Xiaohongshu",
    snippet:
      "Videos under 60 seconds generate 2.5x more engagement than long-form content. Here are the top editing techniques trending this month.",
    date: "2026-05-24",
    url: "#",
  },
  {
    id: "5",
    title: "The Rise of AI-Powered Customer Service on WeChat",
    source: "WeChat",
    snippet:
      "Enterprise adoption of AI chatbots on WeChat has grown 40% year-over-year. Customer satisfaction scores are up across early-adopter brands.",
    date: "2026-05-22",
    url: "#",
  },
  {
    id: "6",
    title: "Beauty Brand Case Studies: Winning on Xiaohongshu",
    source: "Xiaohongshu",
    snippet:
      "Three beauty brands doubled their monthly GMV by leveraging KOL partnerships and product seeding campaigns on the platform.",
    date: "2026-05-20",
    url: "#",
  },
];

export const MOCK_ANALYSIS: TopicAnalysis = {
  summary:
    "This topic highlights the growing importance of AI-driven content strategies across Chinese social platforms. Both WeChat and Xiaohongshu are evolving rapidly, with new tools and features that reward early adopters. Brands that combine authentic storytelling with data-driven optimization are outperforming competitors.",
  keyInsights: [
    "AI-generated content adoption is accelerating, but human oversight remains critical for brand voice consistency.",
    "Short-form video (under 60s) is the highest-engagement format on Xiaohongshu in 2026.",
    "WeChat Mini Programs are becoming a primary commerce channel, not just a supplementary one.",
    "UGC-driven campaigns show 3x higher audience retention compared to brand-produced content.",
  ],
  contentAngles: [
    "Step-by-step tutorial: How to set up an AI content workflow for WeChat Official Accounts.",
    "Comparison article: WeChat vs. Xiaohongshu — which platform fits your brand in 2026?",
    "Case study roundup: 5 brands that crushed it on Xiaohongshu this quarter.",
    "Opinion piece: Why human creativity still matters in the age of AI content.",
  ],
  recommendedPlatforms: [
    {
      name: "WeChat Official Account",
      reason:
        "Long-form articles perform well for thought leadership and in-depth analysis pieces.",
    },
    {
      name: "Xiaohongshu",
      reason:
        "Visual-first format is ideal for tutorials, infographics, and product-related content.",
    },
    {
      name: "Twitter / X",
      reason:
        "Good for sparking discussion and driving traffic back to longer-form content.",
    },
  ],
};
