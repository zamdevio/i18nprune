export type ChangelogItemType =
  | "added"
  | "changed"
  | "fixed"
  | "docs"
  | "deprecations"
  | "breaking";

export type ChangelogSection = {
  title: string;
  type: ChangelogItemType;
  items: string[];
};

export type ChangelogLink = {
  label: string;
  href: string;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  highlights: string[];
  sections: ChangelogSection[];
  links?: ChangelogLink[];
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asItemType(value: unknown): ChangelogItemType {
  switch (value) {
    case "added":
    case "changed":
    case "fixed":
    case "docs":
    case "deprecations":
    case "breaking":
      return value;
    default:
      return "changed";
  }
}

function asSection(value: unknown): ChangelogSection | null {
  if (!isRecord(value)) return null;
  const title = typeof value.title === "string" && value.title.trim().length > 0 ? value.title : null;
  if (!title) return null;
  const items = asStringList(value.items);
  if (items.length === 0) return null;
  return { title, type: asItemType(value.type), items };
}

function asLink(value: unknown): ChangelogLink | null {
  if (!isRecord(value)) return null;
  const label = typeof value.label === "string" && value.label.trim().length > 0 ? value.label : null;
  const href = typeof value.href === "string" && value.href.trim().length > 0 ? value.href : null;
  if (!label || !href) return null;
  return { label, href };
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function asEntry(value: unknown): ChangelogEntry | null {
  if (!isRecord(value)) return null;
  const version = typeof value.version === "string" && value.version.trim().length > 0 ? value.version : null;
  const date = typeof value.date === "string" && isIsoDate(value.date) ? value.date : null;
  if (!version || !date) return null;

  const highlights = asStringList(value.highlights);
  const sections = Array.isArray(value.sections) ? value.sections.map(asSection).filter((v): v is ChangelogSection => v !== null) : [];
  if (highlights.length === 0 && sections.length === 0) return null;

  const links = Array.isArray(value.links) ? value.links.map(asLink).filter((v): v is ChangelogLink => v !== null) : [];
  return { version, date, highlights, sections, links: links.length > 0 ? links : undefined };
}

function byDateDesc(a: ChangelogEntry, b: ChangelogEntry): number {
  return b.date.localeCompare(a.date);
}

/**
 * Append-only changelog source. Keep newest entries at top for easier edits.
 * Validation below guarantees page stability even if an entry is malformed.
 */
const RAW_CHANGELOG: unknown[] = [];

export function getValidatedChangelogEntries(): ChangelogEntry[] {
  return RAW_CHANGELOG.map(asEntry).filter((v): v is ChangelogEntry => v !== null).sort(byDateDesc);
}
