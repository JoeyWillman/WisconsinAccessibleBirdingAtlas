console.log("✅ main.js is running");

// Inject CSS for layout and markers
const style = document.createElement("style");
style.innerHTML = `
#map-wrapper {
  display: flex;
  width: 95%;
  max-width: 1600px;
  height: 600px; /* smaller to fit screen */
  margin: 30px auto;
  border: 3px solid #1A4D7A;
  border-radius: 10px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

#filter-panel {
  width: 270px;
  padding: 20px;
  background-color: #ffffff;
  font-size: 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start; /* ← ensures content aligns left in flexbox */
  text-align: left; /* ← text aligns left */
  border-right: 2px solid #1B6CA7; /* Divider */
}

  #map {
  flex: 1;
  height: 100%;
}


#filter-panel h4 {
  font-size: 18px;
  font-weight: bold;
  color: #1B6CA7;
  margin-bottom: 15px;
}

.filter-group {
  margin-bottom: 10px;
}
  .marker-dot {
    width: 16px;
    height: 16px;
    background: #1B6CA7;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 2px rgba(0,0,0,0.4);
    transition: transform 0.2s ease, background 0.2s ease;
  }
  .marker-dot.hovered {
    background: #FF6600;
    transform: scale(1.5);
    box-shadow: 0 0 6px rgba(255, 102, 0, 0.5);
  }
`;
document.head.appendChild(style);

// Accessibility fields for filtering
const accessibilityFields = [
  { field: "walkbike_info", label: "Walking/Biking Access" },
  { field: "transport_info", label: "Public Transportation" },
  { field: "parking_info", label: "Parking" },
  { field: "bathroom_info", label: "Bathrooms" },
  { field: "ramp_info", label: "Ramps" },
  { field: "step_info", label: "No Steps" },
  { field: "bench_info", label: "Benches" },
  { field: "car_birding", label: "Car Birding" }
];

// Inject filter panel into #filter-panel div already in HTML
const filterPanel = document.getElementById("filter-panel");
filterPanel.innerHTML = `
  <h4>Accessibility Filters</h4>
  ${accessibilityFields.map(item =>
    `<div><input type="checkbox" class="filter-box" data-field="${item.field}" id="${item.field}">
     <label for="${item.field}">${item.label}</label></div>`).join("")}
  <button id="apply-filters" class="btn btn-sm btn-primary mt-2">Apply Filters</button>
`;

// Initialize Leaflet map
const map = L.map('map').setView([43.0731, -89.4012], 10);

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

// Accessibility filtering logic
function matchesAccessibility(site, field) {
  const val = (site[field] || "").toLowerCase().trim();

  const negativeIndicators = [
    "no ", "not available", "not present", "not wheelchair accessible", "none", "lack of", "without", "absent", "not suitable"
  ];

  if (field === "car_birding") return val === "yes" || val === "true";
  if (field === "step_info") return val.includes("no steps") || val.includes("no stairs") || val.includes("step-free");

  for (const phrase of negativeIndicators) {
    if (val.includes(phrase)) return false;
  }

  return true;
}

// Display markers after filtering
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

document.getElementById("apply-filters").addEventListener("click", displayFilteredMarkers);
