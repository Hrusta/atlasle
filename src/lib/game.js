import * as turf from "@turf/turf";

export function bearingToCompass(bearing) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const b = (bearing + 360) % 360;
  const idx = Math.round(b / 45) % 8;
  return dirs[idx];
}

export function evaluateClickToPoint(click, targetLat, targetLng) {
  const clickPt = turf.point([click.lng, click.lat]);
  const targetPt = turf.point([targetLng, targetLat]);

  const km = turf.distance(clickPt, targetPt, { units: "kilometers" });
  const bearing = turf.bearing(clickPt, targetPt);

  return {
    km,
    bearing,
    dir: bearingToCompass(bearing),
  };
}

export function getCapitalWinRadiusKm(areaKm2) {
  const a = Number(areaKm2 || 0);

  if (!a) return 35;
  if (a < 10_000) return 15;
  if (a < 50_000) return 20;
  if (a < 200_000) return 25;
  if (a < 800_000) return 35;
  return 45;
}
