console.log("✅ main.js is running");

// Initialize map
const map = L.map('map', {
  zoomControl: false
}).setView([43.0731, -89.4012], 10);

L.control.zoom({ position: 'topright' }).addTo(map);

L.tileLayer("https://api.maptiler.com/maps/outdoor/{z}/{x}/{y}.png?key=pElhqCSXeJs6cZHy1cx4", {
  attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; OpenStreetMap contributors',
  tileSize: 512,
  zoomOffset: -1,
  maxZoom: 20
}).addTo(map);

// Marker logic
let allMarkers = [];
let siteData = [];

fetch('assets/data/sites.csv')
  .then(res => res.text())
  .then(data => {
    siteData = Papa.parse(data, { header: true }).data;
    displayFilteredMarkers();
  });

function matchesAccessibility(site, field) {
  const val = (site[field] || "").toLowerCase().trim();
  const negativeIndicators = [
    "no ", "not available", "not present", "not wheelchair accessible",
    "none", "lack of", "without", "absent", "not suitable"
  ];

  if (field === "car_birding") return val === "yes" || val === "true";
  if (field === "step_info") return val.includes("no steps") || val.includes("no stairs") || val.includes("step-free");

  return !negativeIndicators.some(phrase => val.includes(phrase));
}

function displayFilteredMarkers() {
  allMarkers.forEach(m => map.removeLayer(m));
  allMarkers = [];

  const activeFilters = Array.from(document.querySelectorAll(".filter-box"))
    .filter(cb => cb.checked)
    .map(cb => cb.getAttribute("data-field"));

  siteData.forEach(site => {
    const lat = parseFloat(site.lat);
    const lon = parseFloat(site.long);
    if (isNaN(lat) || isNaN(lon)) return;

    const passes = activeFilters.every(field => matchesAccessibility(site, field));
    if (!passes) return;

    const divIcon = L.divIcon({
      className: "custom-marker",
      html: `<div class="marker-dot" title="${site.name}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([lat, lon], { icon: divIcon })
      .addTo(map)
      .bindPopup(`
        <b>${site.name}</b><br>${site.description || "No description available."}
        <br><button onclick="window.location.href='tour.html?site_id=${site.site_id}'">View Site</button>
      `);

    marker.on("mouseover", () => {
      const el = marker.getElement()?.querySelector('.marker-dot');
      if (el) el.classList.add("hovered");
    });

    marker.on("mouseout", () => {
      const el = marker.getElement()?.querySelector('.marker-dot');
      if (el) el.classList.remove("hovered");
    });

    allMarkers.push(marker);
  });
}

// Apply filters button
const applyBtn = document.getElementById("apply-filters");
if (applyBtn) {
  applyBtn.addEventListener("click", displayFilteredMarkers);
} else {
  console.warn("⚠️ Could not find #apply-filters button.");
}

// Sidebar toggle buttons
const filterToggle = document.getElementById("filter-toggle");
const filterPanel = document.getElementById("filter-panel");
const closeBtn = document.getElementById("close-filter");

if (filterToggle && filterPanel && closeBtn) {
  filterToggle.addEventListener("click", () => {
    filterPanel.classList.add("active");
    filterToggle.style.display = "none";
  });

  closeBtn.addEventListener("click", () => {
    filterPanel.classList.remove("active");
    filterToggle.style.display = "block";
  });
} else {
  console.warn("⚠️ Filter toggle or close button not found.");
}

// Auto-hide mobile filter state on window resize
window.addEventListener("resize", () => {
  if (window.innerWidth > 1000) {
    // On larger screens, reset sidebar state
    filterPanel.classList.remove("active");
    closeBtn.style.display = "none";
    filterToggle.style.display = "none";
  } else {
    // On small screens, prepare mobile toggle UI
    closeBtn.style.display = "block";
    filterToggle.style.display = filterPanel.classList.contains("active") ? "none" : "block";
  }
});
