import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ModulePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 sm:p-6">
      <Card className="border border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
            The sidebar stays visible here, and this page is ready for the next feature pass.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
