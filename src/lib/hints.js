function bucket(n, ranges) {
  for (const [limit, label] of ranges) {
    if (n <= limit) return label;
  }
  return ranges[ranges.length - 1][1];
}

export function buildHints(meta) {
  if (!meta) return [];

  const region = meta.region || "Unknown";
  const subregion = meta.subregion || null;
  const population = meta.population || 0;
  const area = meta.area || 0;
  const landlocked = !!meta.landlocked;

  const currencies = meta.currencies ? Object.keys(meta.currencies) : [];
  const timezones = meta.timezones || [];

  const popBucket = bucket(population, [
    [1_000_000, "under 1M"],
    [5_000_000, "1–5M"],
    [20_000_000, "5–20M"],
    [80_000_000, "20–80M"],
    [999_999_999_999, "80M+"],
  ]);

  const areaBucket = bucket(area, [
    [50_000, "small (under 50k km²)"],
    [200_000, "medium (50k–200k km²)"],
    [1_000_000, "large (200k–1M km²)"],
    [999_999_999, "huge (1M+ km²)"],
  ]);

  const cap = meta.capital?.[0] || "Unknown";

  const hints = [];
  hints.push(`Region: ${region}`);
  if (subregion) hints.push(`Subregion: ${subregion}`);
  hints.push(landlocked ? "Landlocked" : "Has a coastline");
  hints.push(`Population: ${popBucket}`);
  hints.push(`Area: ${areaBucket}`);
  hints.push(`Currency: ${currencies.length ? currencies.join(", ") : "Unknown"}`);
  hints.push(`Timezones: ${timezones.length}`);

 
  if (cap && cap !== "Unknown") {
    hints.push(`Capital name length: ${cap.length}`);
    hints.push(`Capital starts with: ${cap[0]}`);
  }

  return hints.slice(0, 10);
}
