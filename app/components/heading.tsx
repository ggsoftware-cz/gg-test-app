type HeadingProps = {
  title: string;
  subtitle?: string;
};

export function Heading({ title, subtitle }: HeadingProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-lg text-neutral-500">{subtitle}</p> : null}
    </div>
  );
}
