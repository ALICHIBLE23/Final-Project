async function loadTop10() {
  const loadingDiv = document.getElementById("loadingTop10");
  const contentDiv = document.getElementById("top10Content");
  const candidatesListDiv = document.getElementById("candidatesList");

  try {
    // Fetch from your backend API
    const resp = await fetch("http://localhost:3000/api/top10");
    const planets = await resp.json();

    loadingDiv.style.display = "none";
    contentDiv.style.display = "block";

    if (!planets || planets.length === 0) {
      candidatesListDiv.innerHTML = `
        <div style="text-align:center; color: var(--color-light);">
          No Top 10 Planets Found
        </div>`;
      return;
    }

    let html = '<div style="display: grid; gap: 2rem;">';

    planets.forEach((planet, index) => {
      const rank = index + 1;

      // Normalize keys (make lowercase, trim spaces)
      const keys = Object.keys(planet).reduce((acc, key) => {
        acc[key.trim().toLowerCase()] = planet[key];
        return acc;
      }, {});

      // ✅ Correctly map CSV columns
      const name =
        planet.Planet_name ||
        planet.planet_name ||
        keys["planet_name"] ||
        keys["name"] ||
        "Unnamed";

      // ✅ Fix: Likelihood column is P_CP
      const likelihood = planet.P_CP || planet["P_CP"] || keys["p_cp"] || "N/A";

      const orbitalPeriod =
        planet.orbital_period ||
        keys["orbital_period"] ||
        keys["orbital period (days)"] ||
        "";

      const planetRadius =
        planet.Planet_radius ||
        keys["planet_radius"] ||
        keys["planet radius (r⊕)"] ||
        keys["planet radius (rearth)"] ||
        "";

      const eqTemp =
        planet.Equilibrium_temp ||
        keys["equilibrium_temp"] ||
        keys["equilibrium temp (k)"] ||
        "";

      const transitDepth =
        planet.Transit_depth ||
        keys["transit_depth"] ||
        keys["transit depth (ppm)"] ||
        "";

      const stellarTemp =
        planet.Stellar_temperature ||
        keys["stellar_temperature"] ||
        keys["stellar temp (k)"] ||
        "";

      html += `
        <div style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 12px; border-left: 4px solid var(--color-accent);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <span style="font-family: 'Bellefair', serif; font-size: 3rem; color: var(--color-accent);">#${rank}</span>
                <h3 style="font-family: 'Bellefair', serif; font-size: 1.75rem; color: var(--color-white);">
                  ${name}
                </h3>
              </div>
             <p style="
  color: var(--color-accent);
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 0.8rem 0;
  text-shadow: 0 0 10px rgba(255,255,255,0.3);
">
  Likelihood: <span style="color: var(--color-white); font-size: 2rem;">${likelihood}%</span>
</p>

            </div>
            <span style="background: var(--color-success); color: var(--color-dark); padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px;">
              LIKELY
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 1rem;">
            ${orbitalPeriod ? `<div><strong style="color: var(--color-light);">Orbital Period:</strong><br>${orbitalPeriod} days</div>` : ""}
            ${planetRadius ? `<div><strong style="color: var(--color-light);">Planet Radius:</strong><br>${planetRadius} Earth radii</div>` : ""}
            ${eqTemp ? `<div><strong style="color: var(--color-light);">Equilibrium Temp:</strong><br>${eqTemp} K</div>` : ""}
            ${transitDepth ? `<div><strong style="color: var(--color-light);">Transit Depth:</strong><br>${transitDepth} ppm</div>` : ""}
            ${stellarTemp ? `<div><strong style="color: var(--color-light);">Stellar Temp:</strong><br>${stellarTemp} K</div>` : ""}
          </div>
        </div>
      `;
    });

    html += "</div>";
    candidatesListDiv.innerHTML = html;
  } catch (err) {
    console.error("Error loading top10:", err);
    loadingDiv.innerText = "Error loading Top 10 planets.";
  }
}

// Initialize page
loadTop10();
