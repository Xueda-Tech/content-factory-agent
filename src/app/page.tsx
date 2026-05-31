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
    title: "Topic Insight",
    description:
      "Discover trending topics from WeChat and Xiaohongshu. Get AI-powered analysis and recommendations.",
    href: "/topic-insight",
    icon: Lightbulb,
    color: "text-amber-500",
  },
  {
    title: "Content Creation",
    description:
      "Generate platform-tailored content with AI. Edit and refine before publishing.",
    href: "/content-create",
    icon: PenSquare,
    color: "text-blue-500",
  },
  {
    title: "Quick Publish",
    description:
      "Publish your content to WeChat, Xiaohongshu, and Twitter in one click.",
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
  { label: "Topics Collected", value: "0", icon: Lightbulb },
  { label: "Content Pieces", value: "0", icon: FileText },
  { label: "Published", value: "0", icon: TrendingUp },
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
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Content Factory. Pick a module to get started.
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
        <h2 className="mb-4 text-lg font-semibold">Modules</h2>
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
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </div>
          <CardDescription>
            Your latest actions will appear here once you start creating content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
