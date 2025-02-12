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

            // Add dynamic site details
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
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(tourMap);

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

            console.log("✅ Fullscreen functionality added.");
        })
        .catch((error) => console.error("❌ Error loading site data:", error));
});
