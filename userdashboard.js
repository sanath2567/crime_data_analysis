let fullData = [];
let barChart, pieChart, lineChart, clusterChart, stackedChart;


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
  const state = stateFilter.value;
  const year = yearFilter.value;
  const crime = crimeFilter.value;

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

  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: getChartData(countBy(data, "state"), "Crimes by State"),
    options: commonChartOptions()
  });

  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: getChartData(countBy(data, "crime_type"), "Crime Distribution"),
    options: pieChartOptions()
  });

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
        tension: 0.4
      }]
    },
    options: commonChartOptions()
  });

  // ✅ ADD THESE TWO LINES HERE (LAST LINES)
  drawClusteredBar(data);
  drawStackedBar(data);
}


/* ================= HELPERS ================= */
function countBy(data, key) {
  return data.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function getChartData(obj, label) {
  return {
    labels: Object.keys(obj),
    datasets: [{
      label: label,
      data: Object.values(obj),
      backgroundColor: generateColors(),
      borderWidth: 1
    }]
  };
}

/* ================= CHART STYLES ================= */
function commonChartOptions() {
  return {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#e0fdfc"
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#9ffcf2" },
        grid: { color: "rgba(255,255,255,0.05)" }
      },
      y: {
        ticks: { color: "#9ffcf2" },
        grid: { color: "rgba(255,255,255,0.05)" }
      }
    }
  };
}

function pieChartOptions() {
  return {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#e0fdfc"
        }
      }
    }
  };
}

/* ================= COLORS ================= */
function generateColors() {
  return [
    "#14b8a6",
    "#2dd4bf",
    "#5eead4",
    "#0ea5a4",
    "#22d3ee",
    "#06b6d4",
    "#0891b2",
    "#67e8f9"
  ];
}
function drawClusteredBar(data) {

  const crimeTypes = [...new Set(data.map(d => d.crime_type))];
  const areaTypes = [...new Set(data.map(d => d.area_type))];

  const datasets = areaTypes.map((area, i) => ({
    label: area,
    data: crimeTypes.map(crime =>
      data.filter(d => d.crime_type === crime && d.area_type === area).length
    ),
    backgroundColor: generateColors()[i]
  }));

  clusterChart = new Chart(
    document.getElementById("clusterBarChart"),
    {
      type: "bar",
      data: {
        labels: crimeTypes,
        datasets
      },
      options: commonChartOptions()
    }
  );
}
function drawStackedBar(data) {

  const years = [...new Set(data.map(d => d.year))].sort();
  const categories = [...new Set(data.map(d => d.crime_category))];

  const datasets = categories.map((cat, i) => ({
    label: cat,
    data: years.map(year =>
      data.filter(d => d.year === year && d.crime_category === cat).length
    ),
    backgroundColor: generateColors()[i]
  }));

  stackedChart = new Chart(
    document.getElementById("stackedBarChart"),
    {
      type: "bar",
      data: {
        labels: years,
        datasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "#e0fdfc" }
          }
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: "#9ffcf2" }
          },
          y: {
            stacked: true,
            ticks: { color: "#9ffcf2" }
          }
        }
      }
    }
  );
}
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}




