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

            // Populate site info
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

            const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            });

            osmLayer.addTo(tourMap);

            // Load points and trails
            fetch("assets/data/points.csv")
                .then((res) => res.text())
                .then((data) => {
                    let points = Papa.parse(data, { header: true }).data;
                    points.forEach((point) => {
                        if (point.site_id.trim() === siteId.trim()) {
                            if (point.type === "trail" && point.filename) {
                                let trailUrl = `assets/data/trails/${point.filename}.geojson`;

                                fetch(trailUrl)
                                    .then((res) => res.json())
                                    .then((geojsonData) => {
                                        L.geoJSON(geojsonData, {
                                            style: { color: "blue", weight: 4, opacity: 0.7 }
                                        }).addTo(tourMap)
                                          .bindPopup(`<strong>${point.name}</strong><br>${point.description || "No description available."}`);
                                    })
                                    .catch((error) => console.error(`❌ Error loading trail GeoJSON: ${trailUrl}`, error));
                            } else {
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

            // Accessibility Information!
            const birdabilityDetails = document.getElementById("birdability-details");
            if (birdabilityDetails) {
                const accessibilityFields = [
                    { field: "car_birding", label: "Car Birding" },
                    { field: "walkbike_info", label: "Walking or Biking Access" },
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
                    { field: "other_info", label: "Other Information" }
                ];

                const accessibilityContent = accessibilityFields
                    .map((item) => {
                        const value = site[item.field];
                        return value && value.trim() ? `<div><strong>${item.label}:</strong> ${value}</div>` : null;
                    })
                    .filter(Boolean)
                    .join("");

                birdabilityDetails.innerHTML = accessibilityContent || "<p>No accessibility information available.</p>";
            }

            // Place Contact Notice **Below** Accessibility Information
const accessibilitySection = document.getElementById("birdability-details");
const parentContainer = accessibilitySection.parentNode; // Get the parent element

let contactContainer = document.createElement("div");
contactContainer.id = "contact-container";
contactContainer.style.marginTop = "20px";
contactContainer.style.padding = "15px";
contactContainer.style.background = "#f8f9fa";
contactContainer.style.border = "1px solid #ddd";
contactContainer.style.borderRadius = "5px";
contactContainer.style.textAlign = "center";

contactContainer.innerHTML = `
    <p style="margin-bottom: 8px; font-weight: bold; color: #333;">
        Notice incorrect or missing information?
    </p>
    <a href="contact.html" class="btn btn-secondary btn-sm" target="_blank">
        Let us know!
    </a>
`;

// Insert the new contact notice **after** the accessibility section pleaaaaasse
parentContainer.appendChild(contactContainer);
// Observation tool
let ebirdId = site.ebird_id ? site.ebird_id.trim() : null;
if (ebirdId) {
    const observationDays = document.getElementById("observation-days");
    const observationsList = document.getElementById("observations-list");

    if (observationDays && observationsList) {
        function fetchObservations(days) {
            observationsList.innerHTML = "Loading...";
            fetch(`https://api.ebird.org/v2/data/obs/${ebirdId}/recent?back=${days}`, {
                headers: { "X-eBirdApiToken": "tjd5dj8076eb" },
            })
                .then((res) => res.json())
                .then((data) => {
                    observationsList.innerHTML = data.length
                        ? data.map((obs) =>
                            `<div class="observation-item">
                                <strong>${obs.comName}</strong><br>
                                Seen on: ${new Date(obs.obsDt).toLocaleDateString()}<br>
                                Count: ${obs.howMany || "N/A"}
                            </div>`).join("")
                        : "No recent observations found.";

                    // Add eBird link button below observations
                    let ebirdLinkContainer = document.getElementById("ebird-link-container");
                    
                    if (!ebirdLinkContainer) {
                        ebirdLinkContainer = document.createElement("div");
                        ebirdLinkContainer.id = "ebird-link-container";
                        ebirdLinkContainer.style.textAlign = "center";
                        ebirdLinkContainer.style.marginTop = "10px";

                        const ebirdLink = document.createElement("a");
                        ebirdLink.href = `https://ebird.org/hotspot/${ebirdId}`;
                        ebirdLink.target = "_blank"; // Open in a new tab
                        ebirdLink.innerText = "View eBird Page";
                        ebirdLink.classList.add("btn", "btn-primary"); // Bootstrap button styling

                        ebirdLinkContainer.appendChild(ebirdLink);
                        observationsList.parentNode.appendChild(ebirdLinkContainer);
                    }
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
}

            // Add Fullscreen Button Functionality
            const fullscreenBtn = document.getElementById("fullscreen-btn");
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener("click", () => {
                    const mapContainer = document.getElementById("tour-map-container");
                    if (!document.fullscreenElement) {
                        mapContainer.requestFullscreen().catch((err) => {
                            console.error(`❌ Error entering fullscreen: ${err.message}`);
                        });
                    } else {
                        document.exitFullscreen();
                    }
                });
            }

            // Add Locate Me Button Functionality
            const locateBtn = document.getElementById("locate-btn");
            if (locateBtn) {
                locateBtn.addEventListener("click", () => {
                    if (!navigator.geolocation) {
                        alert("Geolocation is not supported by your browser.");
                        return;
                    }

                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const { latitude, longitude } = position.coords;
                            const userLocation = L.latLng(latitude, longitude);

                            // Add marker for user's location
                            const userMarker = L.marker(userLocation, {
                                icon: L.icon({
                                    iconUrl: "assets/icons/user-location.png", // Custom user location icon
                                    iconSize: [25, 25],
                                    iconAnchor: [12, 25],
                                    popupAnchor: [0, -25],
                                }),
                            }).addTo(tourMap);

                            userMarker.bindPopup("You are here").openPopup();

                            // Zoom in on user's location
                            tourMap.setView(userLocation, 15);
                        },
                        (error) => {
                            console.error(`❌ Error getting location: ${error.message}`);
                            alert("Could not retrieve your location.");
                        }
                    );
                });
            }
            


            console.log("✅ Full functionality restored.");
        })
        .catch((error) => console.error("❌ Error loading site data:", error));
});
