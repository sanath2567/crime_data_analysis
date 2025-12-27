let charts = {};
let rawData = [];

let selections = {
  year: new Set(),
  crime: new Set(),
  state: new Set()
};



/* NOTES */
function openNotes() {
  notes.style.display = "block";
  notesText.value = localStorage.adminNotes || "";
}

function closeNotes() {
  localStorage.adminNotes = notesText.value;
  // Enter the path where to save your notes here
  notes.style.display = "none";
}

/* FILTER */
function toggle(set, value, el) {
  set.has(value) ? set.delete(value) : set.add(value);
  el.classList.toggle("active");
  update();
}

function filtered() {
  return rawData.filter(d =>
    (selections.year.size === 0 || selections.year.has(d.year)) &&
    (selections.crime.size === 0 || selections.crime.has(d.crime_type)) &&
    (selections.state.size === 0 || selections.state.has(d.state))
  );
}

/* KPI */
function updateKPIs(data) {
  const total = data.length || 0;

  const highSeverity = data.filter(
    d => d.crime_severity_level === "high"
  ).length;

  const openCases = data.filter(
    d => d.case_status === "open"
  ).length;

  const responseTimes = data
    .map(d => Number(d.response_time_minutes))
    .filter(v => !isNaN(v));

  const avgResponse =
    responseTimes.length === 0
      ? 0
      : Math.round(
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        );

  kpiTotal.innerText = total;
  kpiHigh.innerText = total ? Math.round((highSeverity / total) * 100) + "%" : "0%";
  kpiOpen.innerText = total ? Math.round((openCases / total) * 100) + "%" : "0%";
  kpiResp.innerText = avgResponse + " min";
  kpiClose.innerText =
    total ? Math.round(((total - openCases) / total) * 100) + "%" : "0%";
}

/* CHART */
function makeChart(id, type, labels, data) {
  if (charts[id]) charts[id].destroy();

  charts[id] = new Chart(document.getElementById(id), {
    type,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map(
          (_, i) => `hsl(${i * 40}, 70%, 55%)`
        )
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

/* MODAL */
// function openModal() {
//   modal.style.display = "flex";
//   modalInfo.innerHTML =
//     "<h3>Chart Insights</h3><p>Detailed breakdown goes here.</p>";
// }

// function closeModal() {
//   modal.style.display = "none";
// }

/* UPDATE */
function update() {
  const data = filtered();

  updateKPIs(data);

  document.querySelector(".crime-type-card").style.display =
    selections.crime.size === 1 ? "none" : "block";

  const byType = {};
  data.forEach(d => byType[d.crime_type] = (byType[d.crime_type] || 0) + 1);
  makeChart("crimeTypeChart", "bar", Object.keys(byType), Object.values(byType));

  const byState = {};
  data.forEach(d => byState[d.state] = (byState[d.state] || 0) + 1);
  const topStates = Object.entries(byState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  makeChart(
    "stateChart",
    "bar",
    topStates.map(x => x[0]),
    topStates.map(x => x[1])
  );

  makeChart(
    "openClosedChart",
    "pie",
    ["Open", "Closed"],
    [
      data.filter(d => d.case_status === "open").length,
      data.filter(d => d.case_status === "closed").length
    ]
  );

  const byMonth = Array(12).fill(0);
  data.forEach(d => byMonth[d.month - 1]++);
  makeChart("monthChart", "bar",
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    byMonth
  );
}

/* LOAD */
fetch("/public/final_format.json")
  .then(r => r.json())
  .then(d => {
    rawData = d;

    [...new Set(d.map(x => x.year))].forEach(v => {
      const s = document.createElement("span");
      s.textContent = v;
      s.onclick = () => toggle(selections.year, v, s);
      yearFilter.appendChild(s);
    });

    [...new Set(d.map(x => x.crime_type))].forEach(v => {
      const s = document.createElement("span");
      s.textContent = v;
      s.onclick = () => toggle(selections.crime, v, s);
      crimeFilter.appendChild(s);
    });

    [...new Set(d.map(x => x.state))].forEach(v => {
      const s = document.createElement("span");
      s.textContent = v;
      s.onclick = () => toggle(selections.state, v, s);
      stateFilter.appendChild(s);
    });

    viewCount.innerText =
      localStorage.views = (+localStorage.views || 0) + 1;

    update();
  });
  function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
