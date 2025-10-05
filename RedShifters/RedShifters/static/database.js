let allPlanets = []
let filteredPlanets = []

async function loadDatabase() {
  try {
    const response = await fetch("/data/confirmed.csv")

    const csvText = await response.text()
    allPlanets = parseCSV(csvText)
    filteredPlanets = [...allPlanets]

    console.log("[v0] Loaded", allPlanets.length, "confirmed planets")
    displayPlanets(filteredPlanets)
    updateCount(filteredPlanets.length)
  } catch (error) {
    console.error("[v0] Error loading database:", error)
    document.getElementById("planetsTable").innerHTML = `
      <div class="loading" style="color: var(--color-error);">
        Error loading database. Please try again later.
      </div>
    `
  }
}

function parseCSV(csvText) {
  const lines = csvText.split("\n")
  const headers = lines[0].split(",").map((h) => h.trim())
  const planets = []

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue
    const values = lines[i].split(",")
    const planet = {}
    headers.forEach((header, index) => {
      planet[header] = values[index]?.trim()
    })
    planets.push(planet)
  }
  return planets
}

function displayPlanets(planets) {
  const tableContainer = document.getElementById("planetsTable")

  if (planets.length === 0) {
    tableContainer.innerHTML = '<div class="loading">No planets found matching your search.</div>'
    return
  }

  const tableHTML = `
    <table>
      <thead>
        <tr>
          <th>Planet Name</th>
          <th>Orbital Period (days)</th>
          <th>Planet Radius (R⊕)</th>
          <th>Equilibrium Temp (K)</th>
          <th>Stellar Temp (K)</th>
          <th>Transit Depth (ppm)</th>
        </tr>
      </thead>
      <tbody>
        ${planets
          .map(
            (planet) => `
          <tr class="planet-row" data-planet='${JSON.stringify(planet).replace(/'/g, "&apos;")}'>
            <td style="color: var(--color-white); font-weight: 600;">${planet.Planet_name || "N/A"}</td>
            <td>${planet.orbital_period || "N/A"}</td>
            <td>${planet.Planet_radius || "N/A"}</td>
            <td>${planet.Equilibrium_temp || "N/A"}</td>
            <td>${planet["Stellar_temperature"] || planet.Stellar_temperature || "N/A"}</td>
            <td>${planet.Transit_depth || "N/A"}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `

  tableContainer.innerHTML = tableHTML

  document.querySelectorAll(".planet-row").forEach((row) => {
    row.style.cursor = "pointer"
    row.addEventListener("click", () => {
      const planet = JSON.parse(row.dataset.planet)
      showPlanetDetails(planet)
    })
  })
}

function updateCount(count) {
  document.getElementById("planetCount").textContent = `${count} Planets`
}

async function showPlanetDetails(planet) {
  const modal = document.getElementById("planetModal")
  const modalBody = document.getElementById("modalBody")

  modal.style.display = "block"
  modalBody.innerHTML = '<div class="loading">Loading planet details and image...</div>'

  try {
    // Fetch NASA image using the planet name
    const response = await fetch(`/api/nasa-images/first-image?q=${encodeURIComponent(planet.Planet_name)}`)
    const data = await response.json()

    let imageHtml = ""
    if (data.imageUrl) {
      imageHtml = `<img src="${data.imageUrl}" alt="${planet.Planet_name}" class="planet-image" style="max-width: 100%; border-radius: 8px; margin: 20px 0;">`
    } else {
      imageHtml =
        '<div class="no-image" style="padding: 20px; text-align: center; color: #888;">No image available from NASA</div>'
    }

    modalBody.innerHTML = `
      <h2 style="color: var(--color-white); margin-bottom: 20px;">${planet.Planet_name}</h2>
      ${imageHtml}
      <div class="planet-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 20px;">
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Disposition:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Disposition || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Right Ascension:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Right_ascension || "N/A"}°</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Declination:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Declination || "N/A"}°</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Transit Epoch:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Transit_epoch || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Orbital Period:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.orbital_period || "N/A"} days</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Transit Duration:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Transit_duration || "N/A"} hours</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Transit Depth:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Transit_depth || "N/A"} ppm</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Planet Radius:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Planet_radius || "N/A"} R⊕</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Insolation Flux:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Insolation_flux || "N/A"} S⊕</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Equilibrium Temperature:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Equilibrium_temp || "N/A"} K</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Magnitude:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Magnitude || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Stellar Temperature:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet["Stellar_temperature"] || planet.Stellar_temperature || "N/A"} K</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Stellar Surface Gravity:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet["Stellar_surface_ gravity"] || "N/A"} log(g)</span>
        </div>
        <div class="detail-row">
          <span class="detail-label" style="color: #888; font-size: 0.9rem;">Stellar Radius:</span>
          <span class="detail-value" style="color: var(--color-white); font-weight: 600;">${planet.Stellar_radius || "N/A"} R☉</span>
        </div>
      </div>
    `
  } catch (error) {
    console.error("[v0] Error loading planet details:", error)
    modalBody.innerHTML = `
      <h2 style="color: var(--color-white);">${planet.Planet_name}</h2>
      <div class="error-message" style="color: #ff6b6b; padding: 20px;">Failed to load NASA image. Please make sure the server is running.</div>
    `
  }
}

const modal = document.getElementById("planetModal")
const closeBtn = document.querySelector(".close")

if (closeBtn) {
  closeBtn.onclick = () => {
    modal.style.display = "none"
  }
}

window.onclick = (event) => {
  if (event.target == modal) {
    modal.style.display = "none"
  }
}

// Search functionality
document.getElementById("searchInput").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase()

  if (searchTerm === "") {
    filteredPlanets = [...allPlanets]
  } else {
    filteredPlanets = allPlanets.filter((planet) => planet.Planet_name?.toLowerCase().includes(searchTerm))
  }

  displayPlanets(filteredPlanets)
  updateCount(filteredPlanets.length)
})

// Load database on page load
loadDatabase()
