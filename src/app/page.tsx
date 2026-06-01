import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Lightbulb,
  PenSquare,
  Send,
  ArrowRight,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Quick-access module cards
// ---------------------------------------------------------------------------

interface ModuleCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const MODULES: ModuleCard[] = [
  {
    title: "话题洞察",
    description:
      "从微信和小红书发现热点话题，获取 AI 分析与推荐。",
    href: "/topic-insight",
    icon: Lightbulb,
    color: "text-amber-500",
  },
  {
    title: "内容创作",
    description:
      "用 AI 生成平台定制内容，编辑润色后一键发布。",
    href: "/content-create",
    icon: PenSquare,
    color: "text-blue-500",
  },
  {
    title: "快速发布",
    description:
      "一键将内容发布到微信公众号、小红书和 Twitter。",
    href: "/publish",
    icon: Send,
    color: "text-emerald-500",
  },
];

function ModuleCardLink({ module }: { module: ModuleCard }) {
  return (
    <Link href={module.href} className="group block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <module.icon className={`size-5 ${module.color}`} />
              <CardTitle className="text-base">{module.title}</CardTitle>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <CardDescription>{module.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Stats row
// ---------------------------------------------------------------------------

interface StatItem {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATS: StatItem[] = [
  { label: "已采集话题", value: "0", icon: Lightbulb },
  { label: "已生成内容", value: "0", icon: FileText },
  { label: "已发布", value: "0", icon: TrendingUp },
];

function StatCard({ stat }: { stat: StatItem }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <stat.icon className="size-5 text-muted-foreground" />
        <div>
          <p className="text-2xl font-bold">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">控制面板</h1>
        <p className="text-muted-foreground">
          欢迎使用内容工厂，选择一个模块开始工作。
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Module quick-access */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">功能模块</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {MODULES.map((mod) => (
            <ModuleCardLink key={mod.href} module={mod} />
          ))}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">最近动态</CardTitle>
          </div>
          <CardDescription>
            开始创作内容后，你的操作记录将显示在这里。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">暂无动态。</p>
        </CardContent>
      </Card>
    </div>
  );
}
