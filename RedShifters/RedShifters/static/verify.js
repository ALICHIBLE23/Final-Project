document.addEventListener("DOMContentLoaded", async () => {
    const resultContainer = document.getElementById("aiResultContainer");
    const resultContent = document.getElementById("aiResultContent");
    const planetTitle = document.getElementById("planetTitle");
    const statusText = document.getElementById("statusText");
    const curveImage = document.getElementById("curveImage");

    // Get planet data from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('planetData');

    let planetData = null;

    if (encodedData) {
        try {
            planetData = JSON.parse(decodeURIComponent(encodedData));
            console.log("Planet data from URL:", planetData);
        } catch (e) {
            console.error("Error parsing URL data:", e);
        }
    }

    // Fallback to localStorage
    if (!planetData) {
        const storedData = localStorage.getItem("pendingPlanet");
        if (storedData) {
            try {
                planetData = JSON.parse(storedData);
                console.log("Planet data from localStorage:", planetData);
            } catch (e) {
                console.error("Error parsing localStorage data:", e);
            }
        }
    }

    if (!planetData) {
        resultContent.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: var(--color-warning); font-size: 1.2rem; margin-bottom: 1rem;">⚠ No planet data found</p>
                <p style="color: var(--color-light); margin-bottom: 2rem;">Please go back and submit the form again.</p>
                <a href="search.html" style="display: inline-block; padding: 1rem 2rem; background: var(--color-accent, #4A90E2); color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Back to Search
                </a>
            </div>
        `;
        planetTitle.textContent = "No planet data available";
        statusText.textContent = "";
        return;
    }

    const planetName = planetData.Planet_name || planetData.Name || "Unknown Planet";

    // ========== AI VERIFICATION SECTION ==========
    try {
        resultContent.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="display: inline-block; width: 50px; height: 50px; border: 5px solid rgba(255,255,255,0.3); border-top-color: var(--color-accent, #4A90E2); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 1rem; color: var(--color-light);">Analyzing planet data with AI...</p>
                <p style="margin-top: 0.5rem; color: var(--color-light); font-size: 0.9rem; opacity: 0.7;">This may take a few seconds</p>
            </div>
        `;

        console.log("Sending request to API with data:", planetData);

const response = await fetch("http://127.0.0.1:5000/api/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(planetData),
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Response error:", errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
console.log("API response:", data);

if (!data.success) {
    throw new Error(data.error || "Prediction failed");
}

const isPlanet = data.is_planet;
const confidence = (data.P_CP * 100).toFixed(2);
const predictedClass = data.predicted_class;
const overallConfidence = (data.confidence * 100).toFixed(2);

        resultContent.innerHTML = `
            <h3 style="color: ${isPlanet ? 'var(--color-success, #4CAF50)' : 'var(--color-warning, #FF9800)'}; font-family: 'Bellefair', serif; font-size: 2rem; margin-bottom: 1rem;">
                ${isPlanet ? '✓' : '⚠'} AI Verification Result
            </h3>
            
            <div style="background: rgba(255, 255, 255, 0.1); padding: 2rem; border-radius: 12px; margin: 1.5rem 0;">
                <div style="display: grid; gap: 1.5rem;">
                    <div>
                        <strong style="color: var(--color-light, #ccc); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Prediction</strong>
                        <p style="font-size: 1.5rem; margin-top: 0.5rem; color: ${isPlanet ? 'var(--color-success, #4CAF50)' : 'var(--color-warning, #FF9800)'}; font-weight: bold;">
                            ${isPlanet ? '🪐 Confirmed Planet (CP)' : '❌ ' + predictedClass}
                        </p>
                    </div>
                    
                    <div>
                        <strong style="color: var(--color-light, #ccc); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Confirmed Planet Probability</strong>
                        <div style="margin-top: 0.5rem;">
                            <div style="background: rgba(255,255,255,0.2); height: 30px; border-radius: 15px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, ${isPlanet ? '#4CAF50' : '#FF9800'}, ${isPlanet ? '#45a049' : '#F57C00'}); height: 100%; width: ${confidence}%; transition: width 1s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: bold; font-size: 0.9rem;">
                                    ${parseFloat(confidence) > 15 ? confidence + '%' : ''}
                                </div>
                            </div>
                            <p style="font-size: 1.8rem; margin-top: 0.75rem; font-weight: bold;">${confidence}%</p>
                        </div>
                    </div>
                    
                    <div>
                        <strong style="color: var(--color-light, #ccc); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Overall Model Confidence</strong>
                        <p style="font-size: 1.2rem; margin-top: 0.5rem; color: white;">${overallConfidence}%</p>
                    </div>

                    ${data.all_probabilities ? `
                    <div>
                        <strong style="color: var(--color-light, #ccc); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">All Classifications</strong>
                        <div style="margin-top: 0.75rem; display: grid; gap: 0.5rem;">
                            ${Object.entries(data.all_probabilities).map(([cls, prob]) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
                                    <span style="color: var(--color-light);">${cls}</span>
                                    <span style="color: white; font-weight: bold;">${(prob * 100).toFixed(2)}%</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div style="background: rgba(255, 255, 255, 0.05); padding: 1.5rem; border-radius: 8px; margin-top: 1.5rem; border-left: 4px solid ${isPlanet ? 'var(--color-success, #4CAF50)' : 'var(--color-warning, #FF9800)'};">
                <h4 style="color: white; margin-bottom: 1rem; font-size: 1.1rem;">📊 Analysis</h4>
                <p style="color: var(--color-light, #ccc); line-height: 1.6;">
                    ${isPlanet
                ? `This candidate shows <strong style="color: var(--color-success, #4CAF50);">strong characteristics of a confirmed planet</strong> with ${confidence}% probability. The AI model analyzed its orbital period, transit characteristics, and stellar parameters to make this determination. This object is highly likely to be a genuine exoplanet.`
                : `This candidate is classified as "<strong style="color: var(--color-warning, #FF9800);">${predictedClass}</strong>" with only ${confidence}% probability of being a confirmed planet. The model suggests this may be a false positive or requires further observation. Additional data collection is recommended before confirmation.`
            }
                </p>
                ${data.missing_features && data.missing_features.length > 0 ? `
                    <p style="color: var(--color-warning, #FF9800); margin-top: 1rem; padding: 1rem; background: rgba(255, 152, 0, 0.1); border-radius: 4px;">
                        <strong>⚠ Note:</strong> Some features were missing and defaulted to 0: ${data.missing_features.join(', ')}. This may affect prediction accuracy.
                    </p>
                ` : ''}
            </div>

            <div style="display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap;">
                <a href="search.html" style="flex: 1; min-width: 200px; padding: 1rem; background: var(--color-accent, #4A90E2); color: white; text-align: center; text-decoration: none; border-radius: 4px; font-weight: bold; transition: all 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    🔍 Search Another Planet
                </a>
                <a href="top10.html" style="flex: 1; min-width: 200px; padding: 1rem; background: rgba(255,255,255,0.1); color: white; text-align: center; text-decoration: none; border-radius: 4px; font-weight: bold; transition: all 0.3s; border: 1px solid rgba(255,255,255,0.2);">
                    📊 View Top 10 Candidates
                </a>
            </div>
        `;

        resultContainer.classList.remove("hidden");

    } catch (err) {
        console.error("Prediction error:", err);
        resultContent.innerHTML = `
            <div style="background: rgba(255, 59, 48, 0.1); padding: 2rem; border-radius: 8px; border-left: 4px solid #FF3B30;">
                <h3 style="color: #FF3B30; margin-bottom: 1rem; font-size: 1.5rem;">❌ Error Getting AI Prediction</h3>
                <p style="color: var(--color-light, #ccc); margin-bottom: 1rem; font-size: 1.1rem;">
                    ${err.message}
                </p>
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                    <p style="color: var(--color-light, #ccc); font-size: 0.9rem; margin: 0;">
                        <strong style="color: white;">Troubleshooting:</strong><br><br>
                        ✓ Make sure the Flask server is running: <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px;">python app.py</code><br>
                        ✓ Check it's running on port 5000: <a href="http://localhost:5000/api/health" target="_blank" style="color: var(--color-accent, #4A90E2);">http://localhost:5000/api/health</a><br>
                        ✓ Check the browser console (F12) for detailed errors<br>
                        ✓ Verify that CORS is enabled on the server
                    </p>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <a href="search.html" style="flex: 1; padding: 0.75rem 1.5rem; background: var(--color-accent, #4A90E2); color: white; text-decoration: none; border-radius: 4px; text-align: center; font-weight: bold;">
                        Try Again
                    </a>
                    <button onclick="location.reload()" style="flex: 1; padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
        resultContainer.classList.remove("hidden");
    }

    // ========== LIGHT CURVE SECTION ==========
    planetTitle.textContent = `Light Curve for ${planetName}`;
    statusText.textContent = "Generating light curve...";

    try {
        console.log(`Fetching light curve for: ${planetName}`);

        const responseLC = await fetch(`http://localhost:3000/api/lightcurve?planet=${encodeURIComponent(planetName)}`);

        console.log("Light curve response status:", responseLC.status);

        if (!responseLC.ok) {
            throw new Error(`Light curve not found (status ${responseLC.status})`);
        }

        const blob = await responseLC.blob();
        const imgUrl = URL.createObjectURL(blob);

        curveImage.src = imgUrl;
        curveImage.style.display = "block";
        statusText.textContent = "Light curve generated successfully ✅";
        statusText.style.color = "var(--color-success, #4CAF50)";

        console.log("Light curve loaded successfully");

    } catch (err) {
        console.error("Light curve error:", err);
        statusText.textContent = `⚠ Error loading light curve for ${planetName}`;
        statusText.style.color = "var(--color-warning, #FF9800)";

        // Show a placeholder or error message
        curveImage.style.display = "none";

        // Add detailed error info
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = "margin-top: 1rem; padding: 1rem; background: rgba(255,152,0,0.1); border-radius: 8px; border-left: 4px solid var(--color-warning, #FF9800);";
        errorDiv.innerHTML = `
            <p style="color: var(--color-light); margin: 0;">
                <strong>Troubleshooting:</strong><br>
                • Make sure the Node.js server is running on port 3000<br>
                • Check that the Python script (lightt.py) is accessible<br>
                • Verify the planet exists in Candidates.csv or Confirmed.csv<br>
                • Check server console for detailed errors
            </p>
        `;
        statusText.parentElement.appendChild(errorDiv);
    }
});

// Add CSS for animations and hover effects
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    a:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.2) !important;
    }
    
    button:hover {
        background: rgba(255,255,255,0.15) !important;
    }
`;
document.head.appendChild(style);