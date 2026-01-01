let fullData = [];
let barChart, pieChart, lineChart, clusterChart, stackedChart, arrestChart;

/* ================= LOAD DATA ================= */
fetch("/public/final_format.json")
  .then(res => res.json())
  .then(data => {
    fullData = data;
    loadFilters(data);
    updateDashboard(data);
  })
  .catch(err => console.error("JSON Error:", err));

/* ================= LOAD FILTERS ================= */
function loadFilters(data) {
  populateFilter("stateFilter", getUnique(data, "state"));
  populateFilter("yearFilter", getUnique(data, "year"));
  populateFilter("crimeFilter", getUnique(data, "crime_type"));
}

function populateFilter(id, values) {
  const select = document.getElementById(id);
  values.sort().forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
  });
}

function getUnique(data, key) {
  return [...new Set(data.map(d => d[key]))];
}

/* ================= APPLY FILTERS ================= */
function applyFilters() {
  const state = document.getElementById("stateFilter").value;
  const year = document.getElementById("yearFilter").value;
  const crime = document.getElementById("crimeFilter").value;

  let filtered = fullData;

  if (state) filtered = filtered.filter(d => d.state === state);
  if (year) filtered = filtered.filter(d => d.year == year);
  if (crime) filtered = filtered.filter(d => d.crime_type === crime);

  updateDashboard(filtered);
}

/* ================= UPDATE DASHBOARD ================= */
function updateDashboard(data) {
  document.getElementById("totalCrimes").innerText =
    data.length.toLocaleString();

  drawCharts(data);
}

/* ================= DRAW CHARTS ================= */
function drawCharts(data) {
  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();
  if (lineChart) lineChart.destroy();
  if (clusterChart) clusterChart.destroy();
  if (stackedChart) stackedChart.destroy();
  if (arrestChart) arrestChart.destroy();

  // 1. Bar Chart: Crimes by State
  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: getChartData(countBy(data, "state"), "Total Incidents"),
    options: commonChartOptions()
  });

  // 2. Pie Chart: Crime Distribution
  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: getChartData(countBy(data, "crime_type"), "Crime Types"),
    options: pieChartOptions()
  });

  // 3. Line Chart: Yearly Trend
  const yearly = countBy(data, "year");
  const sortedYears = Object.keys(yearly).sort();
  lineChart = new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels: sortedYears,
      datasets: [{
        label: "Crimes per Year",
        data: sortedYears.map(y => yearly[y]),
        borderColor: "#2dd4bf",
        backgroundColor: "rgba(45,212,191,0.2)",
        borderWidth: 3,
        tension: 0.4,
        fill: true
      }]
    },
    options: commonChartOptions()
  });

  drawClusteredBar(data);
  drawStackedBar(data);
  drawArrestRateChart(data); // New Chart
}

/* ================= NEW: ARREST RATE CHART (Horizontal Bar) ================= */
function drawArrestRateChart(data) {
  const crimeTypes = [...new Set(data.map(d => d.crime_type))];
  
  const arrestRates = crimeTypes.map(type => {
    const subset = data.filter(d => d.crime_type === type);
    const total = subset.length;
    const arrests = subset.filter(d => d.arrest_made === "yes").length;
    return total > 0 ? ((arrests / total) * 100).toFixed(1) : 0;
  });

  arrestChart = new Chart(document.getElementById("arrestRateChart"), {
    type: "bar",
    data: {
      labels: crimeTypes,
      datasets: [{
        label: "Arrest Success Rate (%)",
        data: arrestRates,
        backgroundColor: crimeTypes.map((_, i) => getColorByIndex(i + 2)), // Offset colors
        borderRadius: 5
      }]
    },
    options: {
      indexAxis: 'y', // Makes it a horizontal bar chart
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { 
          max: 100, 
          ticks: { color: "#9ffcf2" },
          grid: { color: "rgba(255,255,255,0.05)" }
        },
        y: { 
          ticks: { color: "#9ffcf2" },
          grid: { display: false }
        }
      }
    }
  });
}

/* ================= CLUSTERED BAR ================= */
function drawClusteredBar(data) {
  const crimeTypes = [...new Set(data.map(d => d.crime_type))];
  const areaTypes = [...new Set(data.map(d => d.area_type))];

  const datasets = areaTypes.map((area, i) => ({
    label: area,
    data: crimeTypes.map(crime =>
      data.filter(d => d.crime_type === crime && d.area_type === area).length
    ),
    backgroundColor: getColorByIndex(i)
  }));

  clusterChart = new Chart(document.getElementById("clusterBarChart"), {
    type: "bar",
    data: { labels: crimeTypes, datasets },
    options: commonChartOptions()
  });
}

/* ================= STACKED BAR ================= */
function drawStackedBar(data) {
  const years = [...new Set(data.map(d => d.year))].sort();
  const categories = [...new Set(data.map(d => d.crime_category))];

  const datasets = categories.map((cat, i) => ({
    label: cat,
    data: years.map(year =>
      data.filter(d => d.year === year && d.crime_category === cat).length
    ),
    backgroundColor: getColorByIndex(i + 4)
  }));

  stackedChart = new Chart(document.getElementById("stackedBarChart"), {
    type: "bar",
    data: { labels: years, datasets },
    options: {
      ...commonChartOptions(),
      scales: {
        x: { stacked: true, ticks: { color: "#9ffcf2" } },
        y: { stacked: true, ticks: { color: "#9ffcf2" } }
      }
    }
  });
}

/* ================= HELPERS & COLORS ================= */
function countBy(data, key) {
  return data.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function getChartData(obj, label) {
  const keys = Object.keys(obj);
  return {
    labels: keys,
    datasets: [{
      label: label,
      data: Object.values(obj),
      backgroundColor: keys.map((_, i) => getColorByIndex(i)),
      borderWidth: 1
    }]
  };
}

function getColorByIndex(index) {
  const palette = ["#2dd4bf", "#fbbf24", "#f87171", "#818cf8", "#c084fc", "#34d399", "#fb923c", "#60a5fa", "#f472b6", "#a3e635"];
  return palette[index % palette.length];
}

function commonChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#e0fdfc" } } },
    scales: {
      x: { ticks: { color: "#9ffcf2" }, grid: { color: "rgba(255,255,255,0.05)" } },
      y: { ticks: { color: "#9ffcf2" }, grid: { color: "rgba(255,255,255,0.05)" } }
    }
  };
}

function pieChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "right", labels: { color: "#e0fdfc" } } }
  };
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}