import { cn } from "@/lib/utils";

export function LandingSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-black/10 bg-white p-4 shadow-sm max-[390px]:p-3.5 sm:rounded-3xl sm:p-6 lg:p-8",
        className,
      )}
    >
      <h2 className="text-lg font-black tracking-tight text-zinc-950 sm:text-xl">{title}</h2>
      {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-700">{description}</p> : null}
      {children}
    </section>
  );
}
