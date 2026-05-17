type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: Props) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sky-600 dark:text-sky-400">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">{description}</p>
      ) : null}
    </div>
  );
}
