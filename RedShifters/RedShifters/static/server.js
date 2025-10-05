const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")
const createCsvWriter = require("csv-writer").createObjectCsvWriter
const axios = require("axios")
const { exec } = require("child_process")
const util = require("util")

const execPromise = util.promisify(exec)

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())
app.use(express.static(__dirname));

const CSV_FILE = path.join(__dirname, "data", "Confirmed.csv")
const CANDIDATES_FILE = path.join(__dirname, "data", "Candidates.csv")

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, "data"))) {
    fs.mkdirSync(path.join(__dirname, "data"))
}

// Ensure temp directory exists for light curves
if (!fs.existsSync(path.join(__dirname, "temp"))) {
    fs.mkdirSync(path.join(__dirname, "temp"))
}

// Initialize CSV file if it doesn't exist
if (!fs.existsSync(CSV_FILE)) {
    console.warn(`⚠️ CSV file not found at: ${CSV_FILE}`);
    console.warn("Please add or upload your Confirmed.csv manually before starting the server.");
}

// GET all confirmed planets
app.get("/api/planets", (req, res) => {
    const planets = []

    if (!fs.existsSync(CSV_FILE)) {
        return res.json([])
    }

    fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on("data", (row) => {
            planets.push(row)
        })
        .on("end", () => {
            res.json(planets)
        })
        .on("error", (error) => {
            console.error("Error reading CSV:", error)
            res.status(500).json({ error: "Failed to read planets data" })
        })
})

// POST - Add new confirmed planet
app.post("/api/planets", async (req, res) => {
    try {
        const newPlanet = req.body

        // Read existing planets
        const planets = []

        if (fs.existsSync(CSV_FILE)) {
            await new Promise((resolve, reject) => {
                fs.createReadStream(CSV_FILE)
                    .pipe(csv())
                    .on("data", (row) => planets.push(row))
                    .on("end", resolve)
                    .on("error", reject)
            })
        }

        // Add new planet
        planets.push(newPlanet)

        // Write back to CSV
        const csvWriter = createCsvWriter({
            path: CSV_FILE,
            header: [
                { id: "Disposition", title: "Disposition" },
                { id: "Right_ascension", title: "Right_ascension" },
                { id: "Declination", title: "Declination" },
                { id: "Transit_epoch", title: "Transit_epoch" },
                { id: "orbital_period", title: "orbital_period" },
                { id: "Transit_duration", title: "Transit_duration" },
                { id: "Transit_depth", title: "Transit_depth" },
                { id: "Planet_radius", title: "Planet_radius" },
                { id: "Insolation_flux", title: "Insolation_flux" },
                { id: "Equilibrium_temp", title: "Equilibrium_temp" },
                { id: "Magnitude", title: "Magnitude" },
                { id: "Stellar_temperatureÃÂ", title: "Stellar_temperatureÃÂ" },
                { id: "Stellar_surface_ gravity", title: "Stellar_surface_ gravity" },
                { id: "Stellar_radius", title: "Stellar_radius" },
                { id: "Planet_name", title: "Planet_name" },
            ],
        })

        await csvWriter.writeRecords(planets)

        res.json({ success: true, message: "Planet added successfully", planet: newPlanet })
    } catch (error) {
        console.error("Error adding planet:", error)
        res.status(500).json({ error: "Failed to add planet" })
    }
})

// POST - Check if planet exists and add if confirmed
app.post("/api/check-planet", async (req, res) => {
    try {
        const planetData = req.body

        // Read existing planets
        const planets = []

        if (fs.existsSync(CSV_FILE)) {
            await new Promise((resolve, reject) => {
                fs.createReadStream(CSV_FILE)
                    .pipe(csv())
                    .on("data", (row) => planets.push(row))
                    .on("end", resolve)
                    .on("error", reject)
            })
        }

        // Check if planet exists (by name or similar characteristics)
        const exists = planets.find(
            (p) =>
                p.Planet_name === planetData.Planet_name ||
                (Math.abs(Number.parseFloat(p.Right_ascension) - Number.parseFloat(planetData.Right_ascension)) < 0.01 &&
                    Math.abs(Number.parseFloat(p.Declination) - Number.parseFloat(planetData.Declination)) < 0.01),
        )

        if (exists) {
            return res.json({
                exists: true,
                confirmed: true,
                message: "Planet already exists in confirmed database",
                planet: exists,
            })
        }

        // Planet doesn't exist - send to AI for verification (placeholder)
        // In real implementation, this would call your AI service
        res.json({
            exists: false,
            confirmed: false,
            message: "Planet not found. Sending to AI for verification...",
            aiVerificationNeeded: true,
            planetData: planetData,
        })
    } catch (error) {
        console.error("Error checking planet:", error)
        res.status(500).json({ error: "Failed to check planet" })
    }
})

// POST - Bulk upload planets from Excel
app.post("/api/bulk-upload", async (req, res) => {
    try {
        const uploadedPlanets = req.body.planets

        // Read existing planets
        const existingPlanets = []

        if (fs.existsSync(CSV_FILE)) {
            await new Promise((resolve, reject) => {
                fs.createReadStream(CSV_FILE)
                    .pipe(csv())
                    .on("data", (row) => existingPlanets.push(row))
                    .on("end", resolve)
                    .on("error", reject)
            })
        }

        const results = {
            matched: [],
            newCandidates: [],
            addedToDatabase: [],
        }

        // Process each uploaded planet
        for (const planet of uploadedPlanets) {
            const exists = existingPlanets.find(
                (p) =>
                    p.Planet_name === planet.Planet_name ||
                    (Math.abs(Number.parseFloat(p.Right_ascension) - Number.parseFloat(planetData.Right_ascension)) < 0.01 &&
                        Math.abs(Number.parseFloat(p.Declination) - Number.parseFloat(planetData.Declination)) < 0.01),
            )

            if (exists) {
                results.matched.push({ ...planet, matchedWith: exists.Planet_name })
            } else {
                results.newCandidates.push(planet)
            }
        }

        res.json(results)
    } catch (error) {
        console.error("Error processing bulk upload:", error)
        res.status(500).json({ error: "Failed to process bulk upload" })
    }
})

// GET - Search NASA Images API for planet images
app.get("/api/nasa-images/search", async (req, res) => {
    try {
        const { query, media_type = "image", page = 1 } = req.query

        if (!query) {
            return res.status(400).json({ error: "Search query is required" })
        }

        const endpoint = "https://images-api.nasa.gov/search"
        const response = await axios.get(endpoint, {
            params: {
                q: query,
                media_type: media_type,
                page: page,
            },
        })

        res.json(response.data)
    } catch (error) {
        console.error("Error searching NASA API:", error)
        res.status(500).json({ error: "Failed to search NASA images" })
    }
})

// GET - Get asset URLs for a specific NASA ID
app.get("/api/nasa-images/asset/:nasa_id", async (req, res) => {
    try {
        const { nasa_id } = req.params
        const endpoint = `https://images-api.nasa.gov/asset/${nasa_id}`
        const response = await axios.get(endpoint)

        res.json(response.data)
    } catch (error) {
        console.error("Error getting NASA asset:", error)
        res.status(500).json({ error: "Failed to get NASA asset" })
    }
})

// GET - Get first image URL for a planet name
app.get("/api/nasa-images/first-image", async (req, res) => {
    try {
        const { query } = req.query

        if (!query) {
            return res.status(400).json({ error: "Query is required" })
        }

        // Search NASA API
        const searchEndpoint = "https://images-api.nasa.gov/search"
        const searchResponse = await axios.get(searchEndpoint, {
            params: {
                q: query,
                media_type: "image",
                page: 1,
            },
        })

        const items = searchResponse.data?.collection?.items || []

        if (items.length === 0) {
            return res.json({ imageUrl: null, message: "No images found" })
        }

        // Get first item's NASA ID
        const firstItem = items[0]
        const data = firstItem.data || []

        if (data.length === 0) {
            return res.json({ imageUrl: null, message: "No data in first item" })
        }

        const nasaId = data[0].nasa_id

        if (!nasaId) {
            return res.json({ imageUrl: null, message: "No NASA ID found" })
        }

        // Get asset URLs
        const assetEndpoint = `https://images-api.nasa.gov/asset/${nasaId}`
        const assetResponse = await axios.get(assetEndpoint)

        const assetItems = assetResponse.data?.collection?.items || []

        // Find first image URL
        for (const asset of assetItems) {
            const href = asset.href
            if (href && (href.toLowerCase().endsWith(".jpg") || href.toLowerCase().endsWith(".png"))) {
                return res.json({
                    imageUrl: href,
                    nasaId: nasaId,
                    title: data[0].title || "",
                    description: data[0].description || "",
                })
            }
        }

        res.json({ imageUrl: null, message: "No image URL found in assets" })
    } catch (error) {
        console.error("Error getting first image:", error)
        res.status(500).json({ error: "Failed to get first image" })
    }
})

// GET - Top 10 Likely Planets from CSV file
app.get("/api/top10", (req, res) => {
    const filePath = path.join(__dirname, "data", "top10_likely_planets.csv");
    const planets = [];

    if (!fs.existsSync(filePath)) {
        console.warn("⚠️ top10_likely_planets.csv not found at:", filePath);
        return res.json([]);
    }

    fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => planets.push(row))
        .on("end", () => {
            console.log("✅ Loaded Top 10 planets from CSV");
            res.json(planets);
        })
        .on("error", (err) => {
            console.error("❌ Error reading top10 CSV:", err);
            res.status(500).json({ error: "Failed to load top10 planets" });
        });
});

// ========== LIGHT CURVE ENDPOINT ==========
app.get("/api/lightcurve", async (req, res) => {
    const planetName = req.query.planet;

    if (!planetName) {
        console.error("❌ No planet name provided");
        return res.status(400).send("Planet name required");
    }

    console.log(`🔍 Generating light curve for: ${planetName}`);

    // Sanitize planet name for filename
    const safePlanetName = planetName.replace(/[^a-z0-9]/gi, '_');
    const outputPath = path.join(__dirname, "temp", `${safePlanetName}_curve.png`);

    // Determine which CSV file to use (try Candidates first, then Confirmed)
    let csvPath = CANDIDATES_FILE;
    if (!fs.existsSync(csvPath)) {
        csvPath = CSV_FILE;
    }

    if (!fs.existsSync(csvPath)) {
        console.error("❌ No CSV files found");
        return res.status(500).send("CSV data files not found");
    }

    try {
        // Build Python command with proper escaping
        const pythonScript = path.join(__dirname, "lightcurve.py");

        if (!fs.existsSync(pythonScript)) {
            console.error("❌ lightcurve.py not found at:", pythonScript);
            return res.status(500).send("Python script not found");
        }

        const command = `python "${pythonScript}" "${csvPath}" "${planetName}" "${outputPath}"`;

        console.log("🐍 Running command:", command);

        // Execute Python script
        const { stdout, stderr } = await execPromise(command, { timeout: 30000 });

        if (stdout) console.log("📊 Python output:", stdout);
        if (stderr) console.warn("⚠️ Python warnings:", stderr);

        // Check if output file was created
        if (!fs.existsSync(outputPath)) {
            console.error("❌ Light curve image was not created");
            return res.status(500).send("Failed to generate light curve");
        }

        console.log(`✅ Light curve generated successfully: ${outputPath}`);

        // Send the image file
        res.sendFile(outputPath, (err) => {
            if (err) {
                console.error("❌ Error sending file:", err);
                res.status(500).send("Error sending light curve image");
            } else {
                // Clean up temp file after sending (optional)
                setTimeout(() => {
                    if (fs.existsSync(outputPath)) {
                        fs.unlinkSync(outputPath);
                        console.log(`🗑️ Cleaned up temp file: ${outputPath}`);
                    }
                }, 5000);
            }
        });

    } catch (error) {
        console.error("❌ Error generating light curve:", error);

        // More detailed error logging
        if (error.code === 'ENOENT') {
            console.error("Python not found. Make sure Python is installed and in PATH");
            return res.status(500).send("Python not found on server");
        }

        if (error.stderr) {
            console.error("Python error output:", error.stderr);
        }

        res.status(500).send(`Error generating light curve: ${error.message}`);
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/data/confirmed.csv", (req, res) => {
    const filePath = path.join(__dirname, "data", "Confirmed.csv");
    if (!fs.existsSync(filePath)) {
        return res.status(404).send("Confirmed.csv not found");
    }
    res.sendFile(filePath);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📁 CSV file location: ${CSV_FILE}`)
    console.log(`📊 Light curve script: ${path.join(__dirname, "lightcurve.py")}`)
    console.log(`📂 Temp folder: ${path.join(__dirname, "temp")}`)
})