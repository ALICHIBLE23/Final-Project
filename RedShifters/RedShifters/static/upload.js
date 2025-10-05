let confirmedPlanets = []
const XLSX = window.XLSX // Declare the XLSX variable

// Load confirmed planets data
async function loadConfirmedPlanets() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Confirmed-u10InEtr4owY4GGCOzDWdg4dly9Ajk.csv",
    )
    const csvText = await response.text()
    confirmedPlanets = parseCSV(csvText)
    console.log("[v0] Loaded", confirmedPlanets.length, "confirmed planets")
  } catch (error) {
    console.error("[v0] Error loading confirmed planets:", error)
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

// Drag and drop functionality
const uploadBox = document.getElementById("uploadBox")
const fileInput = document.getElementById("fileInput")

uploadBox.addEventListener("click", () => fileInput.click())

uploadBox.addEventListener("dragover", (e) => {
  e.preventDefault()
  uploadBox.classList.add("drag-over")
})

uploadBox.addEventListener("dragleave", () => {
  uploadBox.classList.remove("drag-over")
})

uploadBox.addEventListener("drop", (e) => {
  e.preventDefault()
  uploadBox.classList.remove("drag-over")
  const files = e.dataTransfer.files
  if (files.length > 0) {
    handleFile(files[0])
  }
})

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0])
  }
})

// Handle file upload
function handleFile(file) {
  console.log("[v0] Processing file:", file.name)

  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: "array" })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet)

      console.log("[v0] Parsed", jsonData.length, "planets from file")
      processUploadedPlanets(jsonData)
    } catch (error) {
      console.error("[v0] Error parsing file:", error)
      showError("Error parsing file. Please ensure it is a valid Excel or CSV file.")
    }
  }

  if (file.name.endsWith(".csv")) {
    reader.readAsText(file)
    reader.onload = (e) => {
      const csvData = parseCSV(e.target.result)
      processUploadedPlanets(csvData)
    }
  } else {
    reader.readAsArrayBuffer(file)
  }
}

// Process uploaded planets
function processUploadedPlanets(planets) {
  const results = {
    found: [],
    notFound: [],
    total: planets.length,
  }

  planets.forEach((planet) => {
    const check = checkPlanetExists(planet)
    if (check.exists) {
      results.found.push({ input: planet, match: check.planet })
    } else {
      results.notFound.push(planet)
    }
  })

// Send not-found planets to Flask AI model for verification
if (results.notFound.length > 0) {
  fetch("http://127.0.0.1:5000/api/batch-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planets: results.notFound }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Batch verification result:", data);

      if (data.success && data.results) {
        // Merge AI predictions back into display
        results.aiResults = data.results;
        displayResults(results);
      } else {
        showError("AI verification failed. Please check the server logs.");
      }
    })
    .catch((err) => {
      console.error("Error verifying batch:", err);
      showError("Error connecting to AI server.");
    });
} else {
  displayResults(results);
}
}

function checkPlanetExists(planetData) {
  if (planetData.Planet_name) {
    const found = confirmedPlanets.find((p) => p.Planet_name?.toLowerCase() === planetData.Planet_name.toLowerCase())
    if (found) return { exists: true, planet: found }
  }

  const tolerance = 0.05
  const similar = confirmedPlanets.find((p) => {
    if (!planetData.orbital_period || !planetData.Planet_radius) return false
    const periodMatch =
      Math.abs(Number.parseFloat(p.orbital_period) - Number.parseFloat(planetData.orbital_period)) /
        Number.parseFloat(planetData.orbital_period) <
      tolerance
    const radiusMatch =
      Math.abs(Number.parseFloat(p.Planet_radius) - Number.parseFloat(planetData.Planet_radius)) /
        Number.parseFloat(planetData.Planet_radius) <
      tolerance
    return periodMatch && radiusMatch
  })

  if (similar) return { exists: true, planet: similar }
  return { exists: false }
}

// Display results
function displayResults(results) {
  const uploadResults = document.getElementById("uploadResults")
  const resultsContent = document.getElementById("resultsContent")

  uploadResults.classList.remove("hidden")

  resultsContent.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
            <div style="text-align: center; padding: 1.5rem; background: rgba(46, 204, 113, 0.1); border-radius: 8px; border: 1px solid rgba(46, 204, 113, 0.3);">
                <div style="font-size: 3rem; font-family: 'Bellefair', serif; color: var(--color-success);">${results.found.length}</div>
                <div style="color: var(--color-light); letter-spacing: 2px;">FOUND</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: rgba(243, 156, 18, 0.1); border-radius: 8px; border: 1px solid rgba(243, 156, 18, 0.3);">
                <div style="font-size: 3rem; font-family: 'Bellefair', serif; color: var(--color-warning);">${results.notFound.length}</div>
                <div style="color: var(--color-light); letter-spacing: 2px;">NEW CANDIDATES</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: rgba(74, 144, 226, 0.1); border-radius: 8px; border: 1px solid rgba(74, 144, 226, 0.3);">
                <div style="font-size: 3rem; font-family: 'Bellefair', serif; color: var(--color-accent);">${results.total}</div>
                <div style="color: var(--color-light); letter-spacing: 2px;">TOTAL PROCESSED</div>
            </div>
        </div>

        ${
          results.notFound.length > 0
            ? `
            <div style="background: rgba(243, 156, 18, 0.1); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--color-warning); margin-top: 2rem;">
                <h4 style="color: var(--color-warning); margin-bottom: 1rem; font-family: 'Bellefair', serif; font-size: 1.5rem;">
                    New Candidates Sent to AI
                </h4>
                <p style="color: var(--color-light); margin-bottom: 1rem;">
                    ${results.notFound.length} planet(s) not found in the database have been queued for AI verification.
                </p>
                <details style="margin-top: 1rem;">
                    <summary style="cursor: pointer; color: var(--color-white); margin-bottom: 0.5rem;">View Candidates</summary>
                    <div style="margin-top: 1rem; max-height: 300px; overflow-y: auto;">
                        ${results.notFound.map((p) => `<div style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">${p.Planet_name || "Unnamed"}</div>`).join("")}
                    </div>
                </details>
            </div>
        `
            : ""
        }

        ${
          results.found.length > 0
            ? `
            <div style="background: rgba(46, 204, 113, 0.1); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--color-success); margin-top: 2rem;">
                <h4 style="color: var(--color-success); margin-bottom: 1rem; font-family: 'Bellefair', serif; font-size: 1.5rem;">
                    Confirmed Matches
                </h4>
                <p style="color: var(--color-light);">
                    ${results.found.length} planet(s) matched existing confirmed exoplanets in the database.
                </p>
            </div>
        `
            : ""
        }

        <p style="margin-top: 2rem; font-size: 0.875rem; color: rgba(208, 214, 249, 0.7); text-align: center;">
            Note: AI integration is currently being developed. Verified planets will be automatically added to the database.
        </p>
    `
    // ?? Display AI verification results if available
if (results.aiResults && results.aiResults.length > 0) {
  const aiSection = `
    <div style="background: rgba(74, 144, 226, 0.1); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--color-accent); margin-top: 2rem;">
      <h4 style="color: var(--color-accent); margin-bottom: 1rem; font-family: 'Bellefair', serif; font-size: 1.5rem;">
        ?? AI Verification Results
      </h4>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
          <thead style="color: var(--color-light); font-weight: bold;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
              <th style="text-align:left; padding:0.5rem;">Planet Name</th>
              <th style="text-align:left; padding:0.5rem;">Predicted Class</th>
              <th style="text-align:left; padding:0.5rem;">Confidence (%)</th>
            </tr>
          </thead>
          <tbody>
            ${results.aiResults.map(r => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding:0.5rem;">${r.Planet_name}</td>
                <td style="padding:0.5rem;">${r.predicted_class}</td>
                <td style="padding:0.5rem;">${(r.confidence * 100).toFixed(2)}%</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  resultsContent.insertAdjacentHTML("beforeend", aiSection);
}


  uploadResults.scrollIntoView({ behavior: "smooth" })
  
}

function showError(message) {
  const uploadResults = document.getElementById("uploadResults")
  const resultsContent = document.getElementById("resultsContent")

  uploadResults.classList.remove("hidden")
  resultsContent.innerHTML = `
        <div style="background: rgba(231, 76, 60, 0.1); padding: 2rem; border-radius: 8px; border-left: 4px solid var(--color-error); text-align: center;">
            <h4 style="color: var(--color-error); margin-bottom: 1rem; font-family: 'Bellefair', serif; font-size: 1.5rem;">Error</h4>
            <p style="color: var(--color-light);">${message}</p>
        </div>
    `
}

loadConfirmedPlanets()
