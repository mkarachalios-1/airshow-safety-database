let accidents=[], annual=[];
let accidentsChart, baarChart, fiveMChart, maneuverChart;

function fmt(n){return n==null||isNaN(n)?'—':n.toLocaleString()}

// Dark mode
function applyTheme(initial=false){
  const pref = localStorage.getItem('theme') || 'light';
  if(pref==='dark'){ document.body.classList.add('dark'); } else { document.body.classList.remove('dark'); }
  if(!initial){ update(); }
}
function toggleTheme(){
  const nowDark = !document.body.classList.contains('dark');
  localStorage.setItem('theme', nowDark ? 'dark' : 'light');
  applyTheme();
}

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
  // newest first in the table
  rows = rows.slice().sort((a,b)=>{
    const ad = a.date? Date.parse(a.date) : 0;
    const bd = b.date? Date.parse(b.date) : 0;
    return bd - ad;
  });
  const tbody = document.getElementById('rows');
  tbody.innerHTML = '';
  const frag = document.createDocumentFragment();
  rows.forEach(d=>{
    const tr = document.createElement('tr');
    function td(v, cls){ const td=document.createElement('td'); if(cls) td.className=cls; td.textContent = v==null?'':v; return td; }
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
    tr.appendChild(td(d.contributing_factor||''));
    tr.appendChild(td(d.man_factor===1?'Y':''));
    tr.appendChild(td(d.machine_factor===1?'Y':''));
    tr.appendChild(td(d.medium_factor===1?'Y':''));
    tr.appendChild(td(d.mission_factor===1?'Y':''));
    tr.appendChild(td(d.management_factor===1?'Y':''));
    const tdR = td(d.remarks||'', 'col-remarks'); tdR.title = d.remarks||''; tr.appendChild(tdR);
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}

function themedGridOptions(){
  const dark = document.body.classList.contains('dark');
  return {
    scales:{
      x:{ grid:{ color: dark ? '#333' : '#e5e5e5' }, ticks:{ color: dark ? '#e6e6e6' : '#333' } },
      y:{ grid:{ color: dark ? '#333' : '#e5e5e5' }, ticks:{ color: dark ? '#e6e6e6' : '#333' } }
    },
    plugins:{
      legend:{ labels:{ color: document.body.classList.contains('dark') ? '#e6e6e6' : '#333' } }
    }
  };
}
function legendOnlyOptions(){
  return { plugins:{ legend:{ labels:{ color: document.body.classList.contains('dark') ? '#e6e6e6' : '#333' } } } };
}

function dualAxisOptions(aerPcts){
  const dark = document.body.classList.contains('dark');
  const minVal = Math.max(99.8, Math.floor((Math.min(...aerPcts.filter(x=>!isNaN(x))) - 0.05) * 1000)/1000);
  return {
    scales:{
      x:{ grid:{ color: dark ? '#333' : '#e5e5e5' }, ticks:{ color: dark ? '#e6e6e6' : '#333' } },
      y:{ beginAtZero:true, grid:{ color: dark ? '#333' : '#e5e5e5' }, ticks:{ color: dark ? '#e6e6e6' : '#333' }, title:{ display:true, text:'per 10k events', color: dark ? '#e6e6e6':'#333' } },
      y1:{ position:'right', grid:{ drawOnChartArea:false }, min:minVal, max:100, ticks:{ color: dark ? '#e6e6e6' : '#333', callback:(v)=> v.toFixed(3)+'%' }, title:{ display:true, text:'AER (%)', color: dark ? '#e6e6e6':'#333' } }
    },
    plugins:{ legend:{ labels:{ color: dark ? '#e6e6e6' : '#333' } } }
  };
}


function renderCharts(rows){
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded; skipping charts.');
    return;
  }
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
    options: { ...optionsFixed, ...themedGridOptions() }
  });

  // BAAR/AFR/ACR/AER (from 2020 onwards only)
  const ann = annual.filter(d=> d.year >= 2020);
  const yearsB = ann.map(d=>d.year);
  const baar = ann.map(d=>d.BAAR);
  const afr  = ann.map(d=>d.AFR);
  const acr  = ann.map(d=>d.ACR);
  const aer  = ann.map(d=>d.AER);
  const ctx2 = document.getElementById('baarChart').getContext('2d');
  if(baarChart) baarChart.destroy();
  const aerPct = aer.map(v => (v<=1.5 ? v*100 : v));
  baarChart = new Chart(ctx2, {
    type:'line',
    data:{ labels:yearsB, datasets:[
      { label:'BAAR (per 10k events)', data:baar, yAxisID:'y' },
      { label:'AFR (per 10k events)',  data:afr,  yAxisID:'y' },
      { label:'ACR (per 10k events)',  data:acr,  yAxisID:'y' },
      { label:'AER (Excellence Rate)', data:aerPct, yAxisID:'y1' }
    ]},
    options:{
      responsive:false, animation:false,
      ...dualAxisOptions(aerPct),
      plugins:{ zoom:{ zoom:{ wheel:{enabled:true}, pinch:{enabled:true}, mode:'x' }, pan:{ enabled:true, mode:'x' } } }
    }
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
    options: { ...optionsFixed, ...legendOnlyOptions() }
  });

  // Aerobatic manoeuvre breakdown (from remarks/manoeuvre)
  const keys = [
    ['cuban 8','cuban 8'], ['cuban eight','cuban 8'],
    ['loop','loop'], ['immelman','immelman'], ['immelmann','immelman'],
    ['split s','split-s'],
    ['barrel roll','barrel roll'], ['aileron roll','roll'], ['roll','roll'],
    ['spin','spin'],
    ['hammerhead','hammerhead'], ['stall turn','hammerhead'],
    ['tail slide','tailslide'], ['tailslide','tailslide'],
    ['snap roll','snap roll'],
    ['lomcevak','lomcevak']
  ];
  const mCounts = new Map();
  function bump(k){ mCounts.set(k, (mCounts.get(k)||0)+1); }
  rows.forEach(d=>{
    const text = [d.manoeuvre, d.remarks, d.contributing_factor].map(x=> (x||'')+'').join(' ').toLowerCase();
    keys.forEach(([pat,label])=>{ if(text.includes(pat)) bump(label); });
  });
  let list = Array.from(mCounts.entries()).sort((a,b)=>b[1]-a[1]);
  const other = list.slice(10).reduce((a,b)=>a+b[1],0);
  list = list.slice(0,10);
  if(other>0) list.push(['other', other]);

  const ctx4 = document.getElementById('maneuverChart').getContext('2d');
  if(maneuverChart) maneuverChart.destroy();
  maneuverChart = new Chart(ctx4, {
    type:'pie',
    data:{ labels:list.map(d=>d[0]), datasets:[{ data:list.map(d=>d[1]) }]},
    options: { ...optionsFixed, ...legendOnlyOptions() }
  });
}

function update(){
  let rows = filterData();
  // Sort by date desc for table as requested (latest first)
  rows = rows.slice().sort((a,b)=>{
    const ad = a.date? Date.parse(a.date) : 0;
    const bd = b.date? Date.parse(b.date) : 0;
    return bd - ad;
  });
  updateMetrics(rows);
  renderTable(rows);
  renderCharts(rows);
}

function init(){
  ['search','yearFrom','yearTo','manFilter','machineFilter','mediumFilter','missionFilter','managementFilter']
    .forEach(id=> document.getElementById(id).addEventListener('input', update));
  const tbtn = document.getElementById('themeToggle'); if(tbtn){ tbtn.addEventListener('click', toggleTheme); }
  applyTheme(true);
  update();
}

loadData();