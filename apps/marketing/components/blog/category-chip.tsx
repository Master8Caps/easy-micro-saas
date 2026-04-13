import Link from "next/link";

export function CategoryChip({
  slug,
  name,
  asLink = true,
}: {
  slug: string;
  name: string;
  asLink?: boolean;
}) {
  const className =
    "inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 transition-colors hover:border-indigo-400/50 hover:bg-indigo-500/15 hover:text-indigo-200";

  if (!asLink) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link href={`/blog/category/${slug}`} className={className}>
      {name}
    </Link>
  );
}
