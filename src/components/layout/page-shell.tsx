import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <main className={cn("pb-20", className)}>
      <Container className={containerClassName}>{children}</Container>
    </main>
  );
}
