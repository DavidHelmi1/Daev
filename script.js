const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   Scroll progress bar
   ========================================================================== */
const progressBar = document.getElementById('progressBar');
function updateProgress(){
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  progressBar.style.width = max > 0 ? (h.scrollTop / max) * 100 + '%' : '0%';
}
document.addEventListener('scroll', updateProgress, { passive:true });
updateProgress();

/* ==========================================================================
   Nav: mobile toggle + active section indicator
   ========================================================================== */
const navEl = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => {
  const open = navEl.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
document.querySelectorAll('#navLinks a').forEach(a => a.addEventListener('click', () => navEl.classList.remove('open')));

const navLinkMap = {};
document.querySelectorAll('#navLinks a').forEach(a => { navLinkMap[a.dataset.section] = a; });
const navSections = Object.keys(navLinkMap).map(id => document.getElementById(id)).filter(Boolean);

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      Object.values(navLinkMap).forEach(a => a.classList.remove('active'));
      const link = navLinkMap[entry.target.id];
      if(link) link.classList.add('active');
    }
  });
}, { rootMargin:'-40% 0px -50% 0px', threshold:0 });
navSections.forEach(s => navObserver.observe(s));

document.getElementById('toTop').addEventListener('click', () => {
  window.scrollTo({ top:0, behavior: reduceMotion ? 'auto' : 'smooth' });
});

/* ==========================================================================
   Scroll reveal
   ========================================================================== */
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold:0.15, rootMargin:'0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ==========================================================================
   Status dashboard: counters + meter fills
   ========================================================================== */
function animateNumber(el, target, suffix, decimals){
  if(reduceMotion){ el.textContent = target.toFixed(decimals) + suffix; return; }
  const duration = 1200, start = performance.now();
  function tick(now){
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (eased * target).toFixed(decimals) + suffix;
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statusSection = document.getElementById('status');
let statusFired = false;
const statusIo = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting && !statusFired){
      statusFired = true;
      document.querySelectorAll('.status-meter-fill').forEach(f => {
        f.style.setProperty('--w', f.dataset.fill + '%');
      });
      document.querySelectorAll('[data-count-to]').forEach(el => {
        animateNumber(el, parseFloat(el.dataset.countTo), el.dataset.suffix || '', 0);
      });
      document.querySelectorAll('[data-decimal-to]').forEach(el => {
        animateNumber(el, parseFloat(el.dataset.decimalTo), el.dataset.suffix || '', 1);
      });
      statusIo.unobserve(entry.target);
    }
  });
}, { threshold:0.2 });
if(statusSection) statusIo.observe(statusSection);

/* ==========================================================================
   Copy email to clipboard
   ========================================================================== */
const toast = document.getElementById('toast');
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}
document.getElementById('emailLink').addEventListener('click', (e) => {
  e.preventDefault();
  const email = 'david.helmibahari@gmail.com';
  navigator.clipboard?.writeText(email).then(() => showToast('Email copied to clipboard'))
    .catch(() => { window.location.href = 'mailto:' + email; });
});

/* ==========================================================================
   Download CV -> print-friendly (no PDF file attached in this build)
   ========================================================================== */
document.getElementById('downloadCvBtn').addEventListener('click', () => {
  showToast('Opening print dialog — choose "Save as PDF"');
  setTimeout(() => window.print(), 400);
});

/* ==========================================================================
   Contact form -> mailto
   ========================================================================== */
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const name = data.get('name'), email = data.get('email'), message = data.get('message');
  const subject = encodeURIComponent(`Portfolio contact from ${name}`);
  const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
  window.location.href = `mailto:david.helmibahari@gmail.com?subject=${subject}&body=${body}`;
  showToast('Transmission prepared — check your email client');
});

/* ==========================================================================
   HERO CANVAS — animated infrastructure visualization
   Server / router / cloud / database / clients with data packets flowing.
   ========================================================================== */
(function heroInfra(){
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  let nodes = [], links = [], packets = [];

  const layout = [
    { id:'client1', label:'Client',  cx:0.10, cy:0.30 },
    { id:'client2', label:'Client',  cx:0.10, cy:0.68 },
    { id:'router',  label:'Router',  cx:0.32, cy:0.5 },
    { id:'server',  label:'Server',  cx:0.55, cy:0.28 },
    { id:'db',      label:'Database',cx:0.55, cy:0.72 },
    { id:'cloud',   label:'Cloud',   cx:0.82, cy:0.5 },
  ];
  const linkDefs = [
    ['client1','router'], ['client2','router'],
    ['router','server'], ['router','db'],
    ['server','cloud'], ['db','cloud']
  ];

  function resize(){
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    nodes = layout.map(n => ({ ...n, x:n.cx*w, y:n.cy*h }));
    links = linkDefs;
  }

  function findNode(id){ return nodes.find(n => n.id === id); }

  let lastSpawn = 0;
  function spawnPacket(){
    const [a,b] = links[Math.floor(Math.random()*links.length)];
    const forward = Math.random() > 0.5;
    packets.push({
      from: findNode(forward ? a : b),
      to: findNode(forward ? b : a),
      t:0, speed: 0.004 + Math.random()*0.005
    });
  }

  function draw(ts){
    ctx.clearRect(0,0,w,h);

    // ambient floating particles
    if(!reduceMotion){
      ctx.fillStyle = 'rgba(34,211,238,0.35)';
      for(let i=0;i<28;i++){
        const px = (Math.sin(ts*0.00007 + i*13.1) * 0.5 + 0.5) * w;
        const py = ((ts*0.00002 + i*0.13) % 1) * h;
        ctx.globalAlpha = 0.15 + (Math.sin(ts*0.0004+i)*0.5+0.5)*0.15;
        ctx.beginPath(); ctx.arc(px, py, 1.4, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // links
    links.forEach(([a,b]) => {
      const na = findNode(a), nb = findNode(b);
      ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y);
      ctx.strokeStyle = 'rgba(34,211,238,0.16)'; ctx.lineWidth = 1;
      ctx.stroke();
    });

    // packets
    if(!reduceMotion){
      if(ts - lastSpawn > 420 && packets.length < 20){ lastSpawn = ts; spawnPacket(); }
      packets.forEach(p => p.t += p.speed);
      packets = packets.filter(p => p.t <= 1);
      packets.forEach(p => {
        const x = p.from.x + (p.to.x - p.from.x)*p.t;
        const y = p.from.y + (p.to.y - p.from.y)*p.t;
        ctx.beginPath(); ctx.arc(x,y,2.4,0,Math.PI*2);
        ctx.fillStyle = 'rgba(255,180,84,0.95)';
        ctx.shadowColor = 'rgba(255,180,84,0.8)'; ctx.shadowBlur = 9;
        ctx.fill(); ctx.shadowBlur = 0;
      });
    }

    // nodes
    nodes.forEach(n => {
      ctx.beginPath(); ctx.arc(n.x, n.y, 5.5, 0, Math.PI*2);
      ctx.fillStyle = '#05070d'; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(34,211,238,0.85)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(n.x, n.y, 2, 0, Math.PI*2); ctx.fillStyle = '#22d3ee'; ctx.fill();

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(126,147,176,0.85)';
      ctx.textAlign = n.cx < 0.2 ? 'left' : (n.cx > 0.75 ? 'right' : 'center');
      const lx = n.cx < 0.2 ? n.x + 12 : (n.cx > 0.75 ? n.x - 12 : n.x);
      ctx.fillText(n.label, lx, n.y - 12);
    });

    requestAnimationFrame(draw);
  }

  resize();
  requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
})();

/* ==========================================================================
   SKILLS RADAR CHART
   ========================================================================== */
(function radar(){
  const canvas = document.getElementById('radarCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = 380;
  canvas.width = size*dpr; canvas.height = size*dpr; canvas.style.width = size+'px'; canvas.style.height = size+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const labels = ['Infrastructure','Networking','System Admin','Tech Support','IT Operations','Asset Mgmt'];
  const values = [0.90, 0.85, 0.82, 0.92, 0.85, 0.80];
  const cx = size/2, cy = size/2, radius = size*0.34;
  const sides = labels.length;

  function pointAt(i, r){
    const angle = (Math.PI*2*i/sides) - Math.PI/2;
    return { x: cx + Math.cos(angle)*r, y: cy + Math.sin(angle)*r };
  }

  let progress = 0;
  let started = false;

  function drawFrame(){
    ctx.clearRect(0,0,size,size);

    // grid rings
    for(let ring=1; ring<=4; ring++){
      ctx.beginPath();
      for(let i=0;i<=sides;i++){
        const p = pointAt(i%sides, radius*ring/4);
        i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();
    }
    // axes + labels
    for(let i=0;i<sides;i++){
      const p = pointAt(i, radius);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(p.x,p.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.stroke();

      const lp = pointAt(i, radius+26);
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(126,147,176,0.9)';
      ctx.textAlign = Math.cos((Math.PI*2*i/sides)-Math.PI/2) > 0.3 ? 'left' : (Math.cos((Math.PI*2*i/sides)-Math.PI/2) < -0.3 ? 'right' : 'center');
      ctx.fillText(labels[i], lp.x, lp.y);
    }

    // data polygon
    ctx.beginPath();
    for(let i=0;i<sides;i++){
      const p = pointAt(i, radius*values[i]*progress);
      i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(34,211,238,0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(34,211,238,0.9)'; ctx.lineWidth = 2; ctx.stroke();

    for(let i=0;i<sides;i++){
      const p = pointAt(i, radius*values[i]*progress);
      ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2);
      ctx.fillStyle = '#22d3ee'; ctx.fill();
    }

    if(progress < 1 && !reduceMotion){ progress += 0.025; requestAnimationFrame(drawFrame); }
    else if(reduceMotion){ progress = 1; }
  }

  const radarIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting && !started){
        started = true;
        if(reduceMotion){ progress = 1; drawFrame(); }
        else requestAnimationFrame(drawFrame);
        radarIo.unobserve(entry.target);
      }
    });
  }, { threshold:0.3 });
  radarIo.observe(canvas);
})();

/* ==========================================================================
   TECH STACK GRID + TOOLTIP
   ========================================================================== */
(function techStack(){
  const techData = [
    { name:'MikroTik', level:'Advanced', use:'Router/firewall configuration, DHCP, VPN, network management' },
    { name:'VMware', level:'Advanced', use:'Server virtualization & hosting business applications' },
    { name:'Windows Server', level:'Advanced', use:'Active Directory, user & access management' },
    { name:'Synology NAS', level:'Advanced', use:'File sharing, backup & recovery, storage monitoring' },
    { name:'cPanel', level:'Intermediate', use:'Company email & domain management' },
    { name:'IPPBX / VoIP', level:'Intermediate', use:'Office telephony infrastructure' },
    { name:'LAN / WAN', level:'Advanced', use:'Core network design & troubleshooting' },
    { name:'TCP/IP', level:'Advanced', use:'Network addressing & routing fundamentals' },
    { name:'DHCP', level:'Advanced', use:'Automatic IP address management' },
    { name:'DNS', level:'Advanced', use:'Name resolution & domain management' },
    { name:'Talenta Mekari', level:'Intermediate', use:'HR system — attendance & payroll support' },
    { name:'Fingerspot', level:'Intermediate', use:'Attendance & access device management' },
    { name:'HCLAB', level:'Intermediate', use:'Laboratory information system support' },
    { name:'Medinfras', level:'Intermediate', use:'Healthcare infrastructure system support' },
    { name:'OSS RBA', level:'Basic', use:'Business licensing system coordination' },
  ];

  const grid = document.getElementById('techGrid');
  const tooltip = document.getElementById('techTooltip');

  techData.forEach(t => {
    const el = document.createElement('div');
    el.className = 'tech-item';
    el.textContent = t.name;
    el.addEventListener('mousemove', (e) => {
      tooltip.innerHTML = `<span class="tt-name">${t.name}</span><span class="tt-row">Level: ${t.level}</span><span class="tt-row">${t.use}</span>`;
      tooltip.style.left = Math.min(e.clientX + 16, window.innerWidth - 260) + 'px';
      tooltip.style.top = (e.clientY + 16) + 'px';
      tooltip.classList.add('show');
    });
    el.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
    el.addEventListener('touchstart', () => {
      tooltip.innerHTML = `<span class="tt-name">${t.name}</span><span class="tt-row">Level: ${t.level}</span><span class="tt-row">${t.use}</span>`;
      tooltip.style.left = '50%'; tooltip.style.top = 'auto'; tooltip.style.bottom='90px'; tooltip.style.transform='translateX(-50%)';
      tooltip.classList.add('show');
      setTimeout(() => tooltip.classList.remove('show'), 2200);
    }, { passive:true });
    grid.appendChild(el);
  });
})();

/* ==========================================================================
   INFRASTRUCTURE ARCHITECTURE — interactive canvas diagram
   ========================================================================== */
(function infraDiagram(){
  const canvas = document.getElementById('infraCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const panelBody = document.getElementById('infraPanelBody');
  let w, h, dpr;
  let nodes = [], packets = [];
  let selectedId = null;

  const nodeInfo = {
    internet: { label:'Internet', device:'Internet / ISP Uplink', role:'External Connectivity', status:'ONLINE', fn:'Provides WAN access to the local network.' },
    firewall: { label:'Firewall / Router', device:'MikroTik Router / Firewall', role:'Network Gateway', status:'ONLINE', fn:'Routing / DHCP / Firewall / Network Management.' },
    core:     { label:'Core Network', device:'Core Network Segment', role:'Backbone', status:'ONLINE', fn:'Aggregates traffic between gateway and switch layer.' },
    switch_:  { label:'Switch', device:'Core Switch', role:'Network Distribution', status:'ONLINE', fn:'VLAN segmentation & internal traffic switching.' },
    server:   { label:'Server', device:'VMware Host Server', role:'Virtualization / App Hosting', status:'OPERATIONAL', fn:'Hosts virtualized servers & business applications.' },
    database: { label:'Database', device:'Database / Information System', role:'Data Layer', status:'ONLINE', fn:'Stores data for SIMRS/LIS & business applications.' },
    nas:      { label:'NAS / Backup', device:'Synology NAS', role:'Storage & Backup', status:'PROTECTED', fn:'File sharing, access control, backup & recovery.' },
    cloud:    { label:'Cloud', device:'Cloud / Email (cPanel)', role:'External Services', status:'CONNECTED', fn:'Hosted email & domain management.' },
    pc:       { label:'PC', device:'End-User Workstations', role:'Client Endpoint', status:'100+ MANAGED', fn:'Daily operational endpoints supported by IT.' },
    laptop:   { label:'Laptop', device:'End-User Laptops', role:'Client Endpoint', status:'MANAGED', fn:'Mobile endpoints for staff & management.' },
    printer:  { label:'Printer', device:'Network Printers', role:'Peripheral', status:'ONLINE', fn:'Shared printing resources across departments.' },
  };

  const layoutDefs = [
    { id:'internet', cx:0.5,  cy:0.06 },
    { id:'firewall', cx:0.5,  cy:0.20 },
    { id:'core',     cx:0.5,  cy:0.34 },
    { id:'switch_',  cx:0.5,  cy:0.48 },
    { id:'server',   cx:0.24, cy:0.65 },
    { id:'database', cx:0.5,  cy:0.65 },
    { id:'nas',      cx:0.76, cy:0.65 },
    { id:'cloud',    cx:0.5,  cy:0.80 },
    { id:'pc',       cx:0.18, cy:0.93 },
    { id:'laptop',   cx:0.5,  cy:0.93 },
    { id:'printer',  cx:0.82, cy:0.93 },
  ];

  const linkDefs = [
    ['internet','firewall'], ['firewall','core'], ['core','switch_'],
    ['switch_','server'], ['switch_','database'], ['switch_','nas'],
    ['server','cloud'], ['nas','cloud'],
    ['switch_','pc'], ['switch_','laptop'], ['switch_','printer']
  ];

  function resize(){
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = Math.max(rect.height, 480);
    canvas.width = w*dpr; canvas.height = h*dpr; canvas.style.height = h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    nodes = layoutDefs.map(n => ({ ...n, x:n.cx*w, y:n.cy*h, r: 9 }));
  }

  function findNode(id){ return nodes.find(n => n.id === id); }

  let lastSpawn = 0;
  function spawnPacket(){
    const [a,b] = linkDefs[Math.floor(Math.random()*linkDefs.length)];
    packets.push({ from: findNode(a), to: findNode(b), t:0, speed: 0.005 + Math.random()*0.006 });
  }

  function renderPanel(id){
    const info = nodeInfo[id];
    if(!info){ return; }
    panelBody.innerHTML = `
      <p class="out-label">DEVICE</p>
      <p class="out">${info.device}</p>
      <p class="out-label">ROLE</p>
      <p class="out">${info.role}</p>
      <p class="out-label">STATUS</p>
      <p class="out status-online">● ${info.status}</p>
      <p class="out-label">FUNCTION</p>
      <p class="out" style="margin-bottom:0;">${info.fn}</p>
    `;
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let hit = null;
    nodes.forEach(n => {
      const d = Math.hypot(mx - n.x, my - n.y);
      if(d < 20) hit = n;
    });
    if(hit){ selectedId = hit.id; renderPanel(hit.id); }
  });

  function draw(ts){
    ctx.clearRect(0,0,w,h);

    linkDefs.forEach(([a,b]) => {
      const na = findNode(a), nb = findNode(b);
      ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y);
      ctx.strokeStyle = 'rgba(34,211,238,0.18)'; ctx.lineWidth = 1.2; ctx.stroke();
    });

    if(!reduceMotion){
      if(ts - lastSpawn > 380 && packets.length < 24){ lastSpawn = ts; spawnPacket(); }
      packets.forEach(p => p.t += p.speed);
      packets = packets.filter(p => p.t <= 1);
      packets.forEach(p => {
        const x = p.from.x + (p.to.x-p.from.x)*p.t;
        const y = p.from.y + (p.to.y-p.from.y)*p.t;
        ctx.beginPath(); ctx.arc(x,y,2.4,0,Math.PI*2);
        ctx.fillStyle = 'rgba(255,180,84,0.95)';
        ctx.shadowColor = 'rgba(255,180,84,0.8)'; ctx.shadowBlur = 8;
        ctx.fill(); ctx.shadowBlur = 0;
      });
    }

    nodes.forEach(n => {
      const isSel = n.id === selectedId;
      ctx.beginPath(); ctx.arc(n.x,n.y, isSel ? 10 : 8, 0, Math.PI*2);
      ctx.fillStyle = isSel ? 'rgba(34,211,238,0.18)' : '#0a1220';
      ctx.fill();
      ctx.lineWidth = isSel ? 2.4 : 1.6;
      ctx.strokeStyle = isSel ? '#22d3ee' : 'rgba(34,211,238,0.85)';
      ctx.stroke();
      ctx.beginPath(); ctx.arc(n.x,n.y,2.4,0,Math.PI*2);
      ctx.fillStyle = isSel ? '#ffb454' : '#22d3ee'; ctx.fill();

      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = isSel ? '#e9f2fb' : 'rgba(126,147,176,0.9)';
      ctx.textAlign = 'center';
      ctx.fillText(nodeInfo[n.id].label, n.x, n.y - 16);
    });

    requestAnimationFrame(draw);
  }

  resize();
  requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
})();

/* ==========================================================================
   INCIDENT RESPONSE STEPPER
   ========================================================================== */
(function incident(){
  const steps = Array.from(document.querySelectorAll('.incident-stepper .step'));
  const replayBtn = document.getElementById('replayIncident');
  const statusEl = document.getElementById('incidentStatus');
  let running = false;

  function playSequence(){
    if(running) return;
    running = true;
    steps.forEach(s => s.classList.remove('active','done'));
    statusEl.textContent = 'IN PROGRESS';
    statusEl.style.color = 'var(--amber)';

    let i = 0;
    function next(){
      if(i > 0) steps[i-1].classList.remove('active');
      if(i > 0) steps[i-1].classList.add('done');
      if(i < steps.length){
        steps[i].classList.add('active');
        i++;
        setTimeout(next, 750);
      } else {
        statusEl.textContent = 'RESOLVED';
        statusEl.style.color = 'var(--ok)';
        running = false;
      }
    }
    next();
  }

  const incidentSection = document.getElementById('incident');
  const incidentIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){ playSequence(); incidentIo.unobserve(entry.target); }
    });
  }, { threshold:0.4 });
  if(incidentSection) incidentIo.observe(incidentSection);

  replayBtn.addEventListener('click', playSequence);
})();

/* ==========================================================================
   INTERACTIVE TERMINAL
   ========================================================================== */
(function terminal(){
  const input = document.getElementById('terminalInput');
  const output = document.getElementById('terminalOutput');
  if(!input) return;
  const history = [];
  let historyIdx = -1;

  function printLine(html, cls){
    const p = document.createElement('p');
    if(cls) p.className = cls;
    p.innerHTML = html;
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
  }

  function skillBars(){
    const rows = [
      ['Infrastructure', 10],
      ['Networking', 9],
      ['Technical Support', 10],
      ['System Administration', 8],
      ['IT Operations', 9],
    ];
    let html = '';
    rows.forEach(([label, val]) => {
      const bar = '█'.repeat(val) + '░'.repeat(10-val);
      html += `<div class="skill-bar-row"><span class="skill-bar-label">${label.padEnd(22,' ')}</span><span class="accent-text skill-bar-track">${bar}</span></div>`;
    });
    return html;
  }

  const commands = {
    help: () => `Available commands:\n  about       — who I am\n  skills      — skill overview\n  experience  — work history\n  projects    — key project areas\n  contact     — how to reach me\n  clear       — clear the terminal`,
    about: () => `David Helmi Bahari — IT Infrastructure & Technical Support Engineer.\n5+ years across healthcare & manufacturing. Status: AVAILABLE FOR NEW CHALLENGES.`,
    skills: () => null, // handled specially (renders bars)
    experience: () => `IT Support Technical Service — PT Samco Farma (2026–Present)\nIT Infrastructure & General Affair — ScanMe Labs (2021–2026)`,
    projects: () => `IT Infrastructure Management · Synology NAS & Backup · Network Infrastructure · System Implementation · IT Asset Management`,
    contact: () => `Email: david.helmibahari@gmail.com\nPhone: 0858-1691-4722\nLinkedIn: linkedin.com/in/davidhelmi\nLocation: Kota Tangerang, Indonesia`,
    whoami: () => `david-helmi-bahari`,
    clear: () => { output.innerHTML=''; return ''; },
  };

  function runCommand(raw){
    const cmd = raw.trim().toLowerCase();
    printLine(`<span class="prompt">david@infrastructure:~$</span> ${raw}`);
    if(!cmd){ return; }
    if(cmd === 'skills'){
      printLine(skillBars());
      return;
    }
    if(commands[cmd]){
      const res = commands[cmd]();
      if(res) printLine(res.replace(/\n/g,'<br>'), 'out');
      return;
    }
    printLine(`Command not found: <span class="accent-text">${cmd}</span>. Type <span class="accent-text">help</span> for options.`, 'muted');
  }

  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      const val = input.value;
      if(val.trim()){ history.push(val); historyIdx = history.length; }
      runCommand(val);
      input.value = '';
    } else if(e.key === 'ArrowUp'){
      if(historyIdx > 0){ historyIdx--; input.value = history[historyIdx]; }
      e.preventDefault();
    } else if(e.key === 'ArrowDown'){
      if(historyIdx < history.length - 1){ historyIdx++; input.value = history[historyIdx]; }
      else { historyIdx = history.length; input.value = ''; }
      e.preventDefault();
    }
  });

  document.getElementById('terminalWindow').addEventListener('click', () => input.focus());
})();

/* ==========================================================================
   NETWORK ACTIVITY LOG — simulated, auto-appending
   ========================================================================== */
(function activityLog(){
  const container = document.getElementById('activityLog');
  if(!container) return;
  const samples = [
    'Packet transmitted',
    'Backup completed',
    'NAS synchronized',
    'Endpoint connected',
    'System health check passed',
    'DHCP lease renewed',
    'Firewall rule evaluated',
    'VMware host heartbeat OK',
    'DNS cache refreshed',
    'Vendor ticket acknowledged'
  ];
  let idx = 0;
  const maxLines = 8;

  function timeStr(){
    const d = new Date();
    return d.toTimeString().slice(0,8);
  }

  function addLine(){
    const p = document.createElement('p');
    p.innerHTML = `<span class="log-time">${timeStr()}</span><span class="log-ok">●</span> ${samples[idx % samples.length]}`;
    container.appendChild(p);
    idx++;
    while(container.children.length > maxLines){ container.removeChild(container.firstChild); }
    container.scrollTop = container.scrollHeight;
  }

  addLine(); addLine(); addLine();
  if(!reduceMotion){
    setInterval(addLine, 3200);
  }
})();
