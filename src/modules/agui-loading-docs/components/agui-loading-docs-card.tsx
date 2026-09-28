import type { ReactNode } from "react";

import { Play, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { DocsCodeBlock } from "@/modules/docs";

import type { AGUILoadingDocsPlay } from "../types";

// -----
// Layout only: title, play buttons, the live
// component (children), and the example file's own source.
// Holds no state — everything lives in the example.
// -----
export function AGUILoadingDocsCard({
  title,
  description,
  status,
  plays,
  onReset,
  source,
  children,
}: {
  title: string;
  description: string;
  status: string;
  plays: AGUILoadingDocsPlay[];
  onReset: () => void;
  source: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="font-mono text-base">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {plays.map((play) => (
            <Button key={play.label} size="sm" variant="secondary" onClick={play.onClick}>
              <Play /> {play.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={onReset}>
            <RotateCcw /> Reset
          </Button>
        </div>
        {/* Hidden until the first event: nothing to preview yet. */}
        {status !== "idle" && (
          <div className="relative rounded-md border border-dashed border-border p-4">
            {children}
            <Badge variant="outline" className="absolute top-2 right-2 font-mono text-xs">
              {status}
            </Badge>
          </div>
        )}
        <DocsCodeBlock code={source} />
      </CardContent>
    </Card>
  );
}
