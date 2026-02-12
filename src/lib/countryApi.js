export async function fetchCountryByIso3(iso3) {
  const r = await fetch(`https://restcountries.com/v3.1/alpha/${iso3}`);
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`REST Countries alpha failed: ${r.status} ${txt}`);
  }
  const data = await r.json();
  return data[0];
}

export async function fetchWikiSummary(title) {
  if (!title) return "";
  const r = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );
  if (!r.ok) return "";
  const data = await r.json();
  return data?.extract || "";
}
