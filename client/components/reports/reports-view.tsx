import Link from "next/link";
import { BarChart3, ChevronRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const popularItemsDescription =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vehicula, velit eu auctor malesuada, nunc nisl gravida sem, ac facilisis justo odio vitae leo.";

export function ReportsView() {
  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <Card className="border border-border/60 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Reports</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              Explore reporting modules for branch performance and inventory behavior. Each card opens a dedicated
              report view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Link
                href="/reports/popular-items"
                className="group block rounded-3xl border border-border/60 bg-background/80 p-5 transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <BarChart3 className="size-5" />
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">Popular Item Report</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{popularItemsDescription}</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { popularItemsDescription };
