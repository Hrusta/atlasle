import React, { useEffect, useMemo, useState } from "react";
import WorldMap from "./components/WorldMap";
import { ISO3_POOL } from "./data/iso3";
import { fetchCountryByIso3, fetchWikiSummary } from "./lib/countryApi";
import { buildHints } from "./lib/hints";
import { evaluateClickToPoint, getCapitalWinRadiusKm } from "./lib/game";

const DIR_ARROW = {
  N: "↑", NE: "↗", E: "→", SE: "↘",
  S: "↓", SW: "↙", W: "←", NW: "↖",
};

function pickRandomIso3() {
  return ISO3_POOL[Math.floor(Math.random() * ISO3_POOL.length)];
}

export default function App() {
  const [meta, setMeta] = useState(null);
  const [hints, setHints] = useState([]);
  const [countryDesc, setCountryDesc] = useState("");

  const [marker, setMarker] = useState(null);
  const [wonMarker, setWonMarker] = useState(null);

  const [guesses, setGuesses] = useState([]);
  const [won, setWon] = useState(false);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading…");

  const [showHowTo, setShowHowTo] = useState(true);
  const [showWinModal, setShowWinModal] = useState(false);

  const [toast, setToast] = useState(null);

  const countryName = useMemo(() => meta?.name?.common || "Unknown", [meta]);
  const capitalName = useMemo(() => meta?.capital?.[0] || "Unknown", [meta]);
  const capitalLatLng = useMemo(() => meta?.capitalInfo?.latlng || null, [meta]);
  const winRadiusKm = useMemo(() => getCapitalWinRadiusKm(meta?.area), [meta]);

  useEffect(() => {
    setShowHowTo(true);
  startNewGame();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function showToast(text, type) {
    setToast({ text, type, at: Date.now() });
  }

  async function startNewGame() {
    setLoading(true);
    setWon(false);
    setShowWinModal(false);
    setMarker(null);
    setWonMarker(null);
    setGuesses([]);
    setHints([]);
    setCountryDesc("");
    setMeta(null);
    setToast(null);

    setStatus("Loading country…");

    for (let i = 0; i < 40; i++) {
      const iso3 = pickRandomIso3();
      try {
        const m = await fetchCountryByIso3(iso3);

        if (!m?.capitalInfo?.latlng || m.capitalInfo.latlng.length < 2) continue;
        if (!m?.capital || !m.capital[0]) continue;

        setMeta(m);
        setHints(buildHints(m));
        setStatus("Guess the capital: click on the map.");
        setLoading(false);

        const desc = await fetchWikiSummary(m?.name?.common);
        setCountryDesc(desc || "");

        return;
      } catch (e) {
        console.error("Pick failed:", e);
      }
    }

    setStatus("Could not load a valid country. Try again.");
    setLoading(false);
  }

  function addGuess(g) {
    setGuesses((prev) => {
      const next = [g, ...prev];
      return next.slice(0, 6);
    });
  }

  function handleMapClick(p) {
    if (!meta || !capitalLatLng || won || loading || showHowTo || showWinModal) return;

    setMarker(p);

    const targetLat = capitalLatLng[0];
    const targetLng = capitalLatLng[1];

    const res = evaluateClickToPoint(p, targetLat, targetLng);
    const arrow = DIR_ARROW[res.dir] || "";
    const hit = res.km <= winRadiusKm;

    addGuess({
      lat: p.lat,
      lng: p.lng,
      km: res.km,
      dir: res.dir,
      arrow,
      hit,
      at: Date.now(),
    });

    if (hit) {
      setWon(true);
      setWonMarker(p);
      setStatus(`Congrats!  You found the capital of ${countryName}.`);
      showToast(`Correct  ${capitalName}`, "success");
      setShowWinModal(true);
    } else {
      setStatus(`${res.km.toFixed(0)} km away · ${arrow} ${res.dir}`);
      showToast(`${res.km.toFixed(0)} km · ${arrow} ${res.dir}`, "info");
    }
  }

  const targetBox = useMemo(() => {
    if (!capitalLatLng) return null;
    return { lat: capitalLatLng[0], lng: capitalLatLng[1], radiusKm: winRadiusKm };
  }, [capitalLatLng, winRadiusKm]);

  function closeHowTo() {
  setShowHowTo(false);
}


  const showAnyModal = showHowTo || showWinModal;

  return (
    <div className="app">
      <header className="header">
  <div>
    <div className="titleRow">
      <h1 className="title">Capitalle</h1>
    </div>
    <p className="subtitle">{status}</p>
  </div>

  <div className="actions">
    <button className="btn btnPrimary" onClick={startNewGame} disabled={loading}>
      {won ? "Play again" : "New Game"}
    </button>
  </div>
</header>


      <main className="main">
        <div className="mapWrap">
          <WorldMap
            marker={marker}
            wonMarker={wonMarker}
            targetBox={targetBox}
            onMapClick={handleMapClick}
            disabled={loading || won || showAnyModal}
          />

          {toast ? (
            <div className={`toast ${toast.type}`} key={toast.at}>
              {toast.text}
            </div>
          ) : null}
        </div>

        <aside className="sidebar">
          <h3 className="sideTitle">Hints</h3>
          {loading ? (
            <div className="muted">Loading…</div>
          ) : hints.length ? (
            <ul className="hintList">
              {hints.map((h, i) => (
                <li key={i} className="hintItem">{h}</li>
              ))}
            </ul>
          ) : (
            <div className="muted">No hints.</div>
          )}

          <hr className="sep" />

          <h3 className="sideTitle">Guesses (last 6)</h3>
          {guesses.length === 0 ? (
            <div className="muted">No guesses yet.</div>
          ) : (
            <ul className="list">
              {guesses.map((g, i) => (
                <li key={g.at + "-" + i} className="listItem">
                  <span className="pill">{g.hit ? "✅" : "❌"}</span>
                  <span>{g.km.toFixed(0)} km</span>
                  <span className="pill">{g.arrow} {g.dir}</span>
                </li>
              ))}
            </ul>
          )}

          <button className="btn btnSecondary" onClick={() => setShowHowTo(true)}>
  How to play
</button>

        </aside>
      </main>

      {showHowTo && (
        <div className="modalOverlay" onClick={closeHowTo}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modalTitle">How to play</h2>
            <div className="modalBody">
              <p className="modalText">
                Your goal is to find the <b>capital city</b> of a random country.
              </p>
              <p className="modalText">
                Click anywhere on the map to make a guess.
                You’ll see the distance and direction to go next.
              </p>
              <p className="modalText">
                You win when your click is close enough to the capital.
              </p>
            </div>
            <div className="modalActions">
              <button className="btn btnCenter" onClick={closeHowTo}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {showWinModal && (
        <div className="modalOverlay" onClick={startNewGame}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modalTitle">Congrats</h2>
            <div className="modalBody">
              <p className="modalText">
                Country: <b>{countryName}</b><br />
                Capital: <b>{capitalName}</b>
              </p>
              {countryDesc ? <p className="modalDesc">{countryDesc}</p> : null}
            </div>
            <div className="modalActions">
              <button className="btn btnCenter" onClick={startNewGame}>Play again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
