let accidents=[], annual=[];
let accidentsChart, baarChart, fiveMChart;

function fmt(n){return n==null||isNaN(n)?'—':n.toLocaleString()}

async function loadData(){
  const accRes = await fetch('data/airshow_accidents.json');
  accidents = await accRes.json();
  const annRes = await fetch('data/annual_statistics.json');
  annual = await annRes.json();
  accidents.forEach(d=>{ d.year = d.year? +d.year : null; });
  annual.forEach(d=>{ d.year = +d.year; });
  init();
}

function filterData(){
  const q = document.getElementById('search').value.trim().toLowerCase();
  const y1 = +document.getElementById('yearFrom').value;
  const y2 = +document.getElementById('yearTo').value;
  const mFilters = {
    man: document.getElementById('manFilter').checked,
    machine: document.getElementById('machineFilter').checked,
    medium: document.getElementById('mediumFilter').checked,
    mission: document.getElementById('missionFilter').checked,
    management: document.getElementById('managementFilter').checked
  };
  return accidents.filter(d=>{
    if(d.year && (d.year < y1 || d.year > y2)) return false;
    const has5M = (mFilters.man && d.man_factor===1) ||
                  (mFilters.machine && d.machine_factor===1) ||
                  (mFilters.medium && d.medium_factor===1) ||
                  (mFilters.mission && d.mission_factor===1) ||
                  (mFilters.management && d.management_factor===1);
    if(!has5M) return false;
    if(q){
      const hay = [
        d.aircraft_type,d.category,d.manoeuvre,d.event_name,d.location,d.country,
        d.remarks,d.contributing_factor,d.date
      ].map(x=> (x||'')+'' ).join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}

function updateMetrics(rows){
  const accidentsCount = rows.length;
  const fat = rows.reduce((a,b)=> a + (b.fatalities||0), 0);
  const cas = rows.reduce((a,b)=> a + (b.casualties||0), 0);
  document.getElementById('metricAccidents').textContent = fmt(accidentsCount);
  document.getElementById('metricFatalities').textContent = fmt(fat);
  document.getElementById('metricCasualties').textContent = fmt(cas);
}

function renderTable(rows){
  const tbody = document.getElementById('rows');
  tbody.innerHTML = '';
  const frag = document.createDocumentFragment();
  rows.slice(0, 500).forEach(d=>{
    const tr = document.createElement('tr');
    function td(v){ const td=document.createElement('td'); td.textContent = v==null?'':v; return td; }
    tr.appendChild(td(d.date? d.date.substring(0,10):''));
    tr.appendChild(td(d.aircraft_type||''));
    tr.appendChild(td(d.category||''));
    tr.appendChild(td(d.country||''));
    tr.appendChild(td(d.manoeuvre||''));
    tr.appendChild(td(d.fit===1?'Y':''));
    tr.appendChild(td(d.mac===1?'Y':''));
    tr.appendChild(td(d.loc===1?'Y':''));
    tr.appendChild(td(d.mechanical===1?'Y': (d.structural===1?'Struct':'')));
    tr.appendChild(td(d.enviro===1 || d.weather===1 || d.bird_strike===1 ? 'Y':''));
    tr.appendChild(td(d.fatalities||0));
    tr.appendChild(td(d.casualties||0));
    tr.appendChild(td(d.event_name||''));
    tr.appendChild(td(d.location||''));
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}

function renderCharts(rows){
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded; skipping charts.');
    return;
  }
  // Fixed-size charts (no resize) for stability
  const optionsFixed = { responsive:false, animation:false };

  // Accidents per year (filtered)
  const byYear = new Map();
  rows.forEach(d=>{ if(!d.year) return; byYear.set(d.year,(byYear.get(d.year)||0)+1); });
  const years = Array.from(byYear.keys()).sort((a,b)=>a-b);
  const counts = years.map(y=>byYear.get(y));
  const ctx1 = document.getElementById('accidentsChart').getContext('2d');
  if(accidentsChart) accidentsChart.destroy();
  accidentsChart = new Chart(ctx1, {
    type:'line',
    data:{ labels:years, datasets:[{ label:'Accidents (filtered)', data:counts }]},
    options: optionsFixed
  });

  // BAAR/AFR/ACR/AER (global where available)
  const yearsB = annual.map(d=>d.year);
  const baar = annual.map(d=>d.BAAR);
  const afr  = annual.map(d=>d.AFR);
  const acr  = annual.map(d=>d.ACR);
  const aer  = annual.map(d=>d.AER);
  const ctx2 = document.getElementById('baarChart').getContext('2d');
  if(baarChart) baarChart.destroy();
  baarChart = new Chart(ctx2, {
    type:'line',
    data:{ labels:yearsB, datasets:[
      { label:'BAAR (per 10k events)', data:baar },
      { label:'AFR (per 10k events)',  data:afr  },
      { label:'ACR (per 10k events)',  data:acr  },
      { label:'AER (Excellence Rate)', data:aer  }
    ]},
    options: optionsFixed
  });

  // 5M distribution (filtered)
  const five = {
    Man: rows.filter(d=>d.man_factor===1).length,
    Machine: rows.filter(d=>d.machine_factor===1).length,
    Medium: rows.filter(d=>d.medium_factor===1).length,
    Mission: rows.filter(d=>d.mission_factor===1).length,
    Management: rows.filter(d=>d.management_factor===1).length
  };
  const ctx3 = document.getElementById('fiveMChart').getContext('2d');
  if(fiveMChart) fiveMChart.destroy();
  fiveMChart = new Chart(ctx3, {
    type:'pie',
    data:{ labels:Object.keys(five), datasets:[{ data:Object.values(five) }]},
    options: optionsFixed
  });
}

function update(){
  const rows = filterData();
  updateMetrics(rows);
  renderTable(rows);
  renderCharts(rows);
}

function init(){
  ['search','yearFrom','yearTo','manFilter','machineFilter','mediumFilter','missionFilter','managementFilter']
    .forEach(id=> document.getElementById(id).addEventListener('input', update));
  update();
}

loadData();