export const SERIES = [
  { id: "sv", name: "Scarlet & Violet" },
  { id: "me", name: "Mega Evolution" },
] as const;

export type SeriesId = (typeof SERIES)[number]["id"];

export const TRACKED_SETS = [
  { id: "sv09", name: "Journey Together", series: "sv" },
  { id: "me01", name: "Mega Evolution", series: "me" },
  { id: "me02", name: "Phantasmal Flames", series: "me" },
  { id: "me02.5", name: "Ascended Heroes", series: "me" },
  { id: "me03", name: "Perfect Order", series: "me" },
  { id: "me04", name: "Chaos Rising", series: "me" },
  { id: "me05", name: "Pitch Black", series: "me" },
] as const;

export function setsInSeries(seriesId: SeriesId) {
  return TRACKED_SETS.filter((s) => s.series === seriesId);
}
