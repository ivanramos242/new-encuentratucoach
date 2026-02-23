import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("pb-20", className)}>
      <Container>{children}</Container>
    </main>
  );
}
