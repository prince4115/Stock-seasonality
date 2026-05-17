export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200/70 bg-zinc-50/50 dark:border-zinc-800/70 dark:bg-zinc-900/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-zinc-400">
        <p>
          <strong className="text-zinc-700 dark:text-zinc-300">Not investment advice.</strong> Past
          patterns do not guarantee future results.
        </p>
        <p>&copy; {new Date().getFullYear()} Stock Seasonality Analyzer</p>
      </div>
    </footer>
  );
}
