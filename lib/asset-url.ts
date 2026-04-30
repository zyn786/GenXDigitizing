export function assetUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "";
  return `${base}/${key}`;
}
