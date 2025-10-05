// Placeholder functions - implement these based on your backend
async function checkPlanetExists(planetData) {
    try {
        // Replace with your actual API endpoint if you have one
        const response = await fetch('http://127.0.0.1:5000/api/check-planet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planetData)
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error checking planet:', error);
    }

    // Default to not found if API doesn't exist or fails
    return { exists: false };
}

async function saveCandidatePlanet(planetData) {
    try {
        // Replace with your actual API endpoint if you have one
        const response = await fetch('http://127.0.0.1:5000/api/save-candidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planetData)
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error saving candidate:', error);
    }

    return { success: true }; // Assume success even if API doesn't exist
}

// Handle form submission
document.getElementById("planetForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const planetData = {};

    // Collect all form data and convert to proper types
    formData.forEach((value, key) => {
        if (value.trim() !== "") {
            // Try to convert to number if it's a numeric field
            const numValue = parseFloat(value);
            planetData[key] = isNaN(numValue) ? value : numValue;
        }
    });

    console.log("Form data collected:", planetData);

    const result = await checkPlanetExists(planetData);
    const resultContainer = document.getElementById("resultContainer");
    const resultContent = document.getElementById("resultContent");

    resultContainer.classList.remove("hidden");
    resultContent.className = "result-content";

    if (result.exists) {
        // Planet found in database
        resultContent.classList.add("result-found");
        resultContent.innerHTML = `
        <h3 style="color: var(--color-success); font-family: 'Bellefair', serif; font-size: 2rem; margin-bottom: 1rem;">
            ✓ Planet Found in Database
        </h3>
        ${result.similarity ? '<p style="color: var(--color-warning); margin-bottom: 1rem;">⚠ Found similar planet based on characteristics</p>' : ""}
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
            <div><strong>Planet Name:</strong> ${result.planet.Planet_name || "N/A"}</div>
            <div><strong>Orbital Period:</strong> ${result.planet.orbital_period || "N/A"} days</div>
            <div><strong>Planet Radius:</strong> ${result.planet.Planet_radius || "N/A"} Earth radii</div>
            <div><strong>Equilibrium Temp:</strong> ${result.planet.Equilibrium_temp || "N/A"} K</div>
        </div>
        <p style="margin-top: 1.5rem; color: var(--color-light);">
            This planet is already confirmed in our database.
        </p>
    `;
    } else {
        // Planet not found - save and offer AI verification
        await saveCandidatePlanet(planetData);
        resultContent.classList.add("result-not-found");

        resultContent.innerHTML = `
        <h3 style="color: var(--color-warning); font-family: 'Bellefair', serif; font-size: 2rem; margin-bottom: 1rem;">
            ⚠ Planet Not Found in Database
        </h3>
        <p style="margin-bottom: 1rem;">
            This planet is not in our confirmed database. Would you like to verify it with AI?
        </p>
        <div style="background: rgba(255, 255, 255, 0.1); padding: 1.5rem; border-radius: 8px; margin-top: 1rem;">
            <p style="color: var(--color-light); margin-bottom: 1rem;">
                <strong>Status:</strong> Ready for AI Analysis<br>
                <strong>Next Steps:</strong> Click the button below to send this data to our AI model for verification.
            </p>
            <button id="verifyWithAI" style="width: 100%; padding: 1rem; background: var(--color-accent, #4A90E2); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1.1rem; font-weight: bold; transition: all 0.3s;">
                🔭 Verify with AI Model
            </button>
        </div>
        <p style="margin-top: 1rem; color: var(--color-accent);">
            ✓ Added to candidate planets list. <a href="top10.html" style="color: var(--color-accent); text-decoration: underline;">View Top 10 Likely Planets</a>
        </p>
    `;

        // Add click handler for AI verification
        document.getElementById("verifyWithAI").addEventListener("click", () => {
            // Save to localStorage as backup
            localStorage.setItem("pendingPlanet", JSON.stringify(planetData));

            console.log("Redirecting to verify page with data:", planetData);

            // Encode planet data and redirect to verify page
            const encodedData = encodeURIComponent(JSON.stringify(planetData));
            window.location.href = `verify.html?planetData=${encodedData}`;
        });
    }

    resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
});