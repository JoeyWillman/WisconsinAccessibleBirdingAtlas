console.log("✅ tour.js is running");

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM Loaded");

    function getQueryParam(param) {
        let urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const siteId = getQueryParam("site_id");

    if (!siteId) {
        document.getElementById("site-title").innerText = "Error: No site selected!";
        return;
    }

    fetch("assets/data/sites.csv")
        .then((res) => res.text())
        .then((data) => {
            let parsedData = Papa.parse(data, { header: true }).data;
            let site = parsedData.find((s) => s.site_id.trim() === siteId.trim());

            if (!site) {
                document.getElementById("site-title").innerText = "Error: Site not found!";
                return;
            }

            // Populate main site information
            document.getElementById("site-title").innerText = site.name;
            document.getElementById("site-name").innerText = site.name;
            document.getElementById("site-description").innerText = site.description;

            const aboutDetails = document.getElementById("about-details");
            const details = [
                { label: "Trail Length", value: site.length_of_trail ? `${site.length_of_trail} ${site.unit_of_measure || "mi"}` : null },
                { label: "Trail Type", value: site.type_of_trail || null },
                { label: "Number of Species", value: site.num_species || null },
            ];

            aboutDetails.innerHTML = details
                .filter((detail) => detail.value)
                .map((detail) => `<div><strong>${detail.label}:</strong> ${detail.value}</div>`)
                .join("");

            // Initialize map
            const lat = parseFloat(site.lat);
            const lon = parseFloat(site.long);

            if (isNaN(lat) || isNaN(lon)) {
                document.getElementById("tour-map-container").innerHTML = "<p style='color: red;'>Invalid location data. Map cannot load.</p>";
                return;
            }

            const tourMap = L.map("tour-map").setView([lat, lon], 14);

            // Define the base layers
            const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            });

            const satelliteLayer = L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                {
                    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
                }
            );

            osmLayer.addTo(tourMap);

            // Load points and trails from points.csv
            fetch("assets/data/points.csv")
                .then((res) => res.text())
                .then((data) => {
                    let points = Papa.parse(data, { header: true }).data;
                    points.forEach((point) => {
                        if (point.site_id.trim() === siteId.trim()) {
                            if (point.type === "Trail" && point.filename) {
                                // Load trail GeoJSON
                                let trailUrl = `assets/data/trails/${point.filename}.geojson`;

                                fetch(trailUrl)
                                    .then((res) => res.json())
                                    .then((geojsonData) => {
                                        L.geoJSON(geojsonData, {
                                            style: {
                                                color: "blue",
                                                weight: 4,
                                                opacity: 0.7
                                            }
                                        }).addTo(tourMap)
                                          .bindPopup(`<strong>${point.name}</strong><br>${point.description || "No description available."}`);
                                    })
                                    .catch((error) => console.error(`❌ Error loading trail GeoJSON: ${trailUrl}`, error));
                            } else {
                                // Load points with icons
                                let pointLat = parseFloat(point.lat);
                                let pointLon = parseFloat(point.lon);
                                if (!isNaN(pointLat) && !isNaN(pointLon)) {
                                    let iconUrl = `assets/icons/${point.type}.png`;
                                    let customIcon = L.icon({
                                        iconUrl: iconUrl,
                                        iconSize: [20, 20],
                                        iconAnchor: [16, 32], 
                                        popupAnchor: [0, -32],
                                    });

                                    let popupContent = `<strong>${point.name}</strong><br>${point.description || "No description available."}`;
                                    L.marker([pointLat, pointLon], { icon: customIcon })
                                        .addTo(tourMap)
                                        .bindPopup(popupContent);
                                }
                            }
                        }
                    });
                })
                .catch((error) => console.error("❌ Error loading points data:", error));

            console.log("✅ Map initialized, points and trails loaded.");

            // Accessibility Information
            const birdabilityDetails = document.getElementById("birdability-details");
            const accessibilityFields = [
                { field: "car_birding", label: "Car Birding" },
                { field: "walkbike_info", label: "Walking or Biking Access from Nearby Residential Areas" },
                { field: "transport_info", label: "Public Transportation" },
                { field: "park_fee", label: "Parking or Entrance Fee" },
                { field: "parking_info", label: "Parking Information" },
                { field: "bathroom_info", label: "Bathrooms" },
                { field: "ramp_info", label: "Ramps" },
                { field: "trail_info", label: "Trail Surface" },
                { field: "slope_info", label: "Trail Slope" },
                { field: "trail_width_and_pullouts", label: "Trail Width and Pullouts" },
                { field: "step_info", label: "Steps" },
                { field: "bench_info", label: "Benches" },
                { field: "obstacle_info", label: "Obstacles or Obstructions" },
                { field: "railing_or_barrier_info", label: "Railings or Barriers" },
                { field: "low_vision_info", label: "Features for Blind or Low Vision Visitors" },
                { field: "shade_info", label: "Shade Availability" },
                { field: "noise_info", label: "Noise Levels" },
                { field: "bird_blind_info", label: "Bird Blinds" },
                { field: "maintenance_info", label: "Maintenance Information" },
                { field: "safety_info", label: "Safety Information" },
                { field: "other_info", label: "Other Information" },
            ];

            const accessibilityContent = accessibilityFields
                .map((item) => {
                    const value = site[item.field];
                    if (value && value.trim()) {
                        return `<div class="accessibility-item">
                                    <strong>${item.label}:</strong> ${value}
                                </div>`;
                    }
                    return null;
                })
                .filter(Boolean)
                .join("");

            birdabilityDetails.innerHTML = accessibilityContent
                ? accessibilityContent
                : "<p>No accessibility information available for this site.</p>";

            // Observation tool
            let ebirdId = site.ebird_id ? site.ebird_id.trim() : null;
            if (ebirdId) {
                const observationDays = document.getElementById("observation-days");
                const observationsList = document.getElementById("observations-list");

                function fetchObservations(days) {
                    observationsList.innerHTML = "Loading...";

                    fetch(`https://api.ebird.org/v2/data/obs/${ebirdId}/recent?back=${days}`, {
                        headers: { "X-eBirdApiToken": "tjd5dj8076eb" },
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            observationsList.innerHTML = data.length
                                ? data.map(
                                      (obs) =>
                                          `<div class="observation-item">
                                            <strong>${obs.comName}</strong><br>
                                            Seen on: ${new Date(obs.obsDt).toLocaleDateString()}<br>
                                            Count: ${obs.howMany || "N/A"}
                                          </div>`
                                  ).join("")
                                : "No observations found.";
                        })
                        .catch(() => {
                            observationsList.innerText = "Failed to load observations.";
                        });
                }

                fetchObservations(observationDays.value);

                observationDays.addEventListener("change", () => {
                    fetchObservations(observationDays.value);
                });
            }

            console.log("✅ Full functionality restored with points, trails, and observations.");
        })
        .catch((error) => console.error("❌ Error loading site data:", error));
});
