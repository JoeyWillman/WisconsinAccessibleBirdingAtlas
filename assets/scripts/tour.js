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

             // Use decodeURIComponent to handle character decoding
        function decodeText(text) {
            try {
                return decodeURIComponent(escape(text));
            } catch (e) {
                return text; // Fallback to the original if decoding fails
            }
        }


            // Populate main site information
            document.getElementById("site-title").innerText = site.name;
            document.getElementById("site-name").innerText = site.name;
            document.getElementById("site-description").innerText = site.description;

            // Add dynamic site details (Trail Length, Type, and Number of Species)
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
// Add dynamic Accessibility Information
const birdabilityDetails = document.getElementById("birdability-details");

// Define all the accessibility fields and their descriptions
const accessibilityFields = [
    { field: "car_birding", label: "Car Birding" },
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

// Create the accessibility content dynamically
const accessibilityContent = accessibilityFields
    .map((item) => {
        const value = site[item.field];
        // Include only fields that have valid content
        if (value && value.trim()) {
            return `<div class="accessibility-item">
                        <strong>${item.label}:</strong> ${value}
                    </div>`;
        }
        return null;
    })
    .filter(Boolean) // Remove null entries
    .join("");

// Display the accessibility information or a fallback message
birdabilityDetails.innerHTML = accessibilityContent
    ? accessibilityContent
    : "<p>No accessibility information available for this site.</p>";

            // Initialize map
            const lat = parseFloat(site.lat);
            const lon = parseFloat(site.long);

            if (isNaN(lat) || isNaN(lon)) {
                document.getElementById("tour-map-container").innerHTML = "<p style='color: red;'>Invalid location data. Map cannot load.</p>";
                return;
            }

            const tourMap = L.map("tour-map").setView([lat, lon], 14);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(tourMap);

            // Locate Me Functionality
            let locationMarker;
            let circle;

            function getLocation() {
                tourMap.locate({ setView: true, watch: true, enableHighAccuracy: true });

                function onLocationFound(e) {
                    let radius = e.accuracy / 2;
                    console.log(`Location accuracy: ${e.accuracy} meters`);

                    if (locationMarker) {
                        tourMap.removeLayer(locationMarker);
                        tourMap.removeLayer(circle);
                    }

                    if (e.accuracy < 90) {
                        circle = L.circle(e.latlng, { radius: radius, interactive: false }).addTo(tourMap);
                        locationMarker = L.marker(e.latlng, { interactive: false }).addTo(tourMap);
                    }

                    if (e.accuracy < 40) {
                        tourMap.stopLocate();
                    }
                }

                tourMap.on("locationfound", onLocationFound);

                window.setInterval(function () {
                    tourMap.locate({ setView: false, enableHighAccuracy: true });
                }, 2500);
            }

            document.getElementById("locate-btn").addEventListener("click", getLocation);

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

            // Fullscreen functionality
            const fullscreenBtn = document.getElementById("fullscreen-btn");
            const mapContainer = document.getElementById("tour-map-container");

            fullscreenBtn.addEventListener("click", () => {
                if (!document.fullscreenElement) {
                    mapContainer.requestFullscreen().catch((err) => {
                        console.error(`Error attempting to enable fullscreen: ${err.message}`);
                    });
                    fullscreenBtn.textContent = "Exit Fullscreen";
                } else {
                    document.exitFullscreen();
                    fullscreenBtn.textContent = "Fullscreen";
                }
            });

            // Update button text on fullscreen changes
            document.addEventListener("fullscreenchange", () => {
                if (!document.fullscreenElement) {
                    fullscreenBtn.textContent = "Fullscreen";
                }
            });

            console.log("✅ Fullscreen and Locate Me functionalities added.");
        })
        .catch((error) => console.error("❌ Error loading site data:", error));
});
