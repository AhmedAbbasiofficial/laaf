import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-[1440px] px-4 md:px-8 lg:px-12", className)}>
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  className,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  className?: string;
  center?: boolean;
}) {
  return (
    <div className={cn(center ? "text-center max-w-2xl mx-auto" : "max-w-2xl", className)}>
      {eyebrow && (
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-accent">
          {eyebrow}
        </span>
      )}
      <h2 className="font-serif text-[1.8rem] font-normal leading-[1.1] mt-2 md:text-[2.4rem] text-foreground">
        {title}
      </h2>
      {intro && (
        <p className="mt-3 text-[0.85rem] leading-relaxed text-muted-foreground">{intro}</p>
      )}
    </div>
  );
}