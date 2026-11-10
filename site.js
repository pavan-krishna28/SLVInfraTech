/* ---- SETTINGS (edit here) ---- */
var CONFIG = {
  wa1: '917411113053',            // Punith Venkatesh WhatsApp
  leadEndpoint: '',               // optional: URL that accepts a JSON POST (e.g. the FastAPI /api/contact). Empty = open WhatsApp with the details filled in
  /* Package rates in Rs per sq ft of built-up area. Leave '' until confirmed - the page then says "Get a quote". */
  packages: [
    { name: 'Economy',      rate: '1869', stilt: '', desc: 'Dependable, code-compliant home with practical material grades.' },
    { name: 'Standard',     rate: '2069', stilt: '', desc: 'Step up to mid-grade materials and a balanced mix of finishes.' },
    { name: 'Standard Pro', rate: '2269', stilt: '1669', desc: 'Durability-forward specifications for everyday comfort.' },
    { name: 'Premium',      rate: '2619', stilt: '', desc: 'Richer surfaces, fittings and hardware throughout.' },
    { name: 'Premium Pro',  rate: '2819', stilt: '', desc: 'Top-grade materials with maximum flexibility on premium systems.' }
  ],
  popular: 2,                    /* index of the tier tagged Most picked (-1 = none) */
  specs: {},                      /* optional per-tier details, e.g. { 2: { 'Main flooring': 'Up to Rs 80/sft' } } */
  warrantyYears: ''               // structural warranty in years, e.g. '10'. '' = shows "Ask us"
};

/* lead delivery shared by every form and the chatbot */
window.slvSendLead = function (lead, done) {
  lead.page = location.pathname; lead.time = new Date().toISOString();
  if (CONFIG.leadEndpoint) {
    fetch(CONFIG.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
      .then(function (r) { done(r.ok ? 'sent' : 'fail'); }).catch(function () { done('fail'); });
  } else {
    var m = 'Hello SLV Infra Tech, I am ' + lead.name + ' (+91 ' + lead.phone + ').' +
      (lead.topic ? ' Enquiry: ' + lead.topic + '.' : '') + (lead.service ? ' Service: ' + lead.service + '.' : '') +
      (lead.plot ? ' Plot size: ' + lead.plot + '.' : '') + (lead.floors ? ' Floors: ' + lead.floors + '.' : '') +
      (lead.loc ? ' Location: ' + lead.loc + '.' : '') + (lead.when ? ' Timeline: ' + lead.when + '.' : '') + (lead.note ? ' ' + lead.note : '');
    window.open('https://wa.me/' + CONFIG.wa1 + '?text=' + encodeURIComponent(m), '_blank');
    done('wa');
  }
};
function validPhone(v) { var d = String(v || '').replace(/\D/g, ''); return d.length >= 10 && /^[6-9]\d{9}$/.test(d.slice(-10)); }

/* mobile menu */
(function () {
  var b = document.getElementById('mbtn'), n = document.getElementById('mainnav');
  if (b && n) b.onclick = function () { n.classList.toggle('open'); b.setAttribute('aria-expanded', n.classList.contains('open')); };
})();

/* two-step hero form */
(function () {
  var hf = document.getElementById('hf');
  if (!hf) return;
  var card = hf.closest('.fcard');
  hf.querySelector('[data-next]').onclick = function () {
    var n = hf.elements.name, p = hf.elements.phone;
    if (!n.value.trim()) { n.focus(); return; }
    if (!validPhone(p.value)) { p.focus(); p.setCustomValidity('Enter a valid 10-digit mobile number'); p.reportValidity(); p.setCustomValidity(''); return; }
    card.classList.add('s2');
  };
  hf.querySelector('.back').onclick = function () { card.classList.remove('s2'); };
})();

/* generic lead forms */
document.querySelectorAll('form[data-lead]').forEach(function (f) {
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(f);
    if (f.elements.phone && !validPhone(d.get('phone'))) { f.elements.phone.focus(); return; }
    var l = { name: d.get('name'), phone: String(d.get('phone') || '').replace(/\D/g, '').slice(-10), service: d.get('service'), plot: d.get('plot'), loc: d.get('loc'), topic: d.get('topic'), when: d.get('when'), note: d.get('message') };
    window.slvSendLead(l, function (st) {
      var th = f.parentNode.querySelector('.thanks');
      f.style.display = 'none'; if (th) { th.style.display = 'block'; if (st === 'fail') th.querySelector('p').textContent = 'Could not send. Please call +91 74111 13053.'; }
    });
  });
});

/* videos: only one plays at a time */
document.addEventListener('play', function (e) {
  if (e.target.tagName !== 'VIDEO' || !e.target.controls) return;
  document.querySelectorAll('video[controls]').forEach(function (v) { if (v !== e.target) v.pause(); });
}, true);

/* project filters */
document.querySelectorAll('.filters button').forEach(function (b) {
  b.onclick = function () {
    document.querySelectorAll('.filters button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
    document.querySelectorAll('#pgrid .pcard').forEach(function (c) { c.classList.toggle('hide', b.dataset.f !== 'all' && c.dataset.s !== b.dataset.f); });
  };
});

/* project gallery thumbnails */
(function () {
  var main = document.getElementById('gmain'); if (!main) return;
  document.querySelectorAll('.gth img').forEach(function (im) {
    im.onclick = function () { main.style.backgroundImage = 'url(' + im.dataset.full + ')'; document.querySelectorAll('.gth img').forEach(function (x) { x.classList.remove('on'); }); im.classList.add('on'); };
  });
})();

/* packages: rates + estimator + explorer */
(function () {
  var pk = CONFIG.packages || [];
  function rate(i) { var r = pk[i] && parseFloat(pk[i].rate); return r || 0; }
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function fmt(n) { return n >= 1e7 ? '₹' + (n / 1e7).toFixed(2) + ' Cr' : '₹' + (n / 1e5).toFixed(2) + ' L'; }
  document.querySelectorAll('[data-rate]').forEach(function (el) { var r = rate(+el.dataset.rate); el.innerHTML = r ? inr(r) + '<small> / sq.ft</small>' : 'Get a quote'; });
  var rs = pk.map(function (p, i) { return rate(i); }).filter(Boolean);
  var rng = document.getElementById('estRangeTxt');
  if (rng) rng.textContent = rs.length ? '5 tiers from ' + inr(Math.min.apply(0, rs)) + ' to ' + inr(Math.max.apply(0, rs)) + '/sq.ft. Same construction process — material quality scales with the tier.' : '5 tiers. Same construction process — material quality scales with the tier. Rates are confirmed after a plot review.';

  var est = document.getElementById('est');
  var tier = 2;
  if (est) {
    var chips = document.getElementById('estChips'), area = document.getElementById('estArea'), sl = document.getElementById('estSlider'), out = document.getElementById('estOut'), sub = document.getElementById('estSub'), tb = document.getElementById('estTier'), per = document.getElementById('estPer'), st = document.getElementById('estStilt'), al = document.getElementById('estAreaLab');
    pk.forEach(function (p, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tchip' + (i === tier ? ' on' : '');
      b.innerHTML = '<b>' + p.name + '</b><small>' + (rate(i) ? inr(rate(i)) + '/sft' : 'Get a quote') + '</small>';
      b.onclick = function () { tier = i; chips.querySelectorAll('.tchip').forEach(function (x, k) { x.classList.toggle('on', k === i); }); calc(); };
      chips.appendChild(b);
    });
    function calc() {
      var a = parseFloat(area.value) || 0, r = rate(tier);
      al.textContent = a.toLocaleString('en-IN') + ' sq.ft.'; sl.value = a; tb.textContent = pk[tier].name;
      if (r && a) { out.textContent = fmt(a * r); sub.textContent = a.toLocaleString('en-IN') + ' sq.ft. built-up · ' + inr(r) + '/sft · ' + document.getElementById('estLoc').value; per.textContent = inr(r); }
      else { out.textContent = 'Get a quote'; sub.textContent = 'Indicative rates are confirmed after we review your plot and plan.'; per.textContent = '—'; }
      var s = parseFloat(pk[tier].stilt); st.textContent = s ? inr(s) : 'Quoted separately';
    }
    area.oninput = function () { calc(); }; sl.oninput = function () { area.value = sl.value; calc(); };
    document.getElementById('estLoc').addEventListener('areachange', calc); calc();
  }

  var ex = document.getElementById('pex');
  if (ex) {
    var SPEC = [
      ['Architecture & Structure', [['Structural design', 'RCC structural design for your plot and floors'], ['Plans', 'Drawings prepared for BBMP approval'], ['Structural work', 'RCC frame — columns, beams, slabs']]],
      ['Pre-Construction', [['Site survey', 'Plot measurement and layout marking'], ['Earth work', 'Excavation and backfill as per design'], ['Anti-termite', 'Treatment of soil and foundation']]],
      ['Flooring', [['Main flooring', 'Living and dining areas'], ['Bedroom flooring', 'All bedrooms'], ['Balcony, utility & parking', 'Practical flooring for outdoor and service areas'], ['Common areas', 'Staircase and passages']]],
      ['Kitchen', [['Platform', 'Kitchen countertop and wall dado'], ['Sink & faucet', 'Fitted as per tier'], ['Provisions', 'Water purifier, washing machine, exhaust and chimney points']]],
      ['Bathroom & Sanitary', [['Sanitary ware', 'Master and other bathrooms'], ['Wall cladding', 'Tiling in wet areas'], ['Plumbing lines', 'Supply and drainage lines'], ['Sewer lines', 'Connected to the main line']]],
      ['Doors & Windows', [['Main door', 'Frame, shutter and finish'], ['Internal doors', 'Frames and flush doors'], ['Bathroom doors', 'Moisture-resistant doors'], ['Windows & grills', 'As per design']]],
      ['Painting', [['Interior', 'Putty, primer and emulsion'], ['Exterior', 'Primer and exterior emulsion']]],
      ['Electrical', [['Wiring', 'Concealed wiring with quality cables'], ['Switches & switchgear', 'Boards, MCBs and earthing'], ['Points', 'Lights, fans and sockets as per plan']]],
      ['Construction & Structure', [['Steel', 'TMT reinforcement'], ['Concrete & cement', 'Mix and grade as per structural design'], ['Masonry', 'Brickwork and plastering'], ['Slab height', 'As per sanctioned plan']]],
      ['Water & Civil', [['Overhead tank', 'Provision as per tier'], ['Sump', 'Brick or RCC sump as per design'], ['Waterproofing', 'Roof and wet areas']]],
      ['Staircase', [['Railings', 'Staircase railing as per tier']]]
    ];
    var tabs = document.getElementById('pexTabs'), box = document.getElementById('pexBody'), cur = 2;
    function esc(t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
    function render() {
      var p = pk[cur], r = rate(cur), h = '', data = (window.PKG && window.PKG[cur]) || null;
      var desc = (data && data.desc) || p.desc;
      h += '<div class="pxh"><div>' + (CONFIG.popular === cur ? '<span class="eyebrow" style="margin:0 0 10px">Most picked</span>' : '') + '<h3>' + p.name + ' Package</h3><p>' + esc(desc) + '</p></div><div class="pxr"><b>' + (r ? inr(r) : 'Get a quote') + '</b><small>' + (r ? 'per sq.ft.' : 'rate on request') + '</small></div></div><div class="spg">';
      if (data) {
        data.cats.forEach(function (c) {
          h += '<div class="spc"><h4>' + esc(c[0]) + '</h4><ul>' + c[1].map(function (i) { return '<li><i class="ck">✓</i><span><b>' + esc(i[0]) + ':</b> ' + esc(i[1]) + (i[2] ? '<small>' + esc(i[2]) + '</small>' : '') + '</span></li>'; }).join('') + '</ul></div>';
        });
      }
      box.innerHTML = h + '</div>';
    }
    pk.forEach(function (p, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ptab' + (i === cur ? ' on' : '');
      b.innerHTML = '<span>' + p.name + '</span><b>' + (rate(i) ? inr(rate(i)) : 'Get a quote') + '</b><small>' + (rate(i) ? '/ sq.ft.' : '') + '</small>';
      b.onclick = function () { cur = i; tabs.querySelectorAll('.ptab').forEach(function (x, k) { x.classList.toggle('on', k === i); }); render(); };
      tabs.appendChild(b);
    });
    render();
  }
})();

/* multi-step forms */
document.querySelectorAll('form[data-steps]').forEach(function (f) {
  var steps = f.querySelectorAll('.fs'), i = 0, lab = f.querySelector('.fslab'), back = f.querySelector('.fsback'), next = f.querySelector('.fsnext');
  function show() { steps.forEach(function (s, k) { s.style.display = k === i ? 'block' : 'none'; }); lab.textContent = 'Step ' + (i + 1) + ' of ' + steps.length + ' — ' + steps[i].dataset.t; back.style.display = i ? 'inline-flex' : 'none'; next.textContent = i === steps.length - 1 ? f.dataset.submit : 'Next →'; }
  back.onclick = function () { if (i) { i--; show(); } };
  next.onclick = function () {
    var ok = true; steps[i].querySelectorAll('[required]').forEach(function (inp) { if (!inp.value.trim()) { ok = false; inp.focus(); } });
    if (ok && steps[i].querySelector('[name=phone]') && !validPhone(steps[i].querySelector('[name=phone]').value)) { ok = false; steps[i].querySelector('[name=phone]').focus(); }
    if (!ok) return;
    if (i < steps.length - 1) { i++; show(); return; }
    var d = new FormData(f);
    window.slvSendLead({ name: d.get('name'), phone: String(d.get('phone')).replace(/\D/g, '').slice(-10), loc: d.get('loc'), plot: d.get('plot'), when: d.get('when'), note: d.get('message'), topic: f.dataset.topic }, function () { f.style.display = 'none'; f.parentNode.querySelector('.thanks').style.display = 'block'; });
  };
  show();
});

/* planner (guided steps) */
(function () {
  var pl = document.getElementById('planner'); if (!pl) return;
  var steps = pl.querySelectorAll('.pstep'), i = 0, data = {};
  var bar = document.getElementById('pbar'), lab = document.getElementById('plab'), back = document.getElementById('pback'), next = document.getElementById('pnext');
  function show() {
    steps.forEach(function (s, k) { s.style.display = k === i ? 'block' : 'none'; });
    var pct = Math.round(((i + 1) / steps.length) * 100); bar.style.width = pct + '%'; lab.textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
    back.style.visibility = i ? 'visible' : 'hidden'; next.textContent = i === steps.length - 1 ? 'Get My Plan →' : 'Continue →';
  }
  pl.querySelectorAll('.opt').forEach(function (o) {
    o.onclick = function () { o.parentNode.querySelectorAll('.opt').forEach(function (x) { x.classList.remove('on'); }); o.classList.add('on'); data[o.parentNode.dataset.k] = o.dataset.v; };
  });
  back.onclick = function () { if (i) { i--; show(); } };
  next.onclick = function () {
    var s = steps[i], k = s.dataset.req;
    if (k && !data[k]) { s.classList.add('shake'); setTimeout(function () { s.classList.remove('shake'); }, 400); return; }
    if (s.dataset.inputs) {
      var ok = true; s.querySelectorAll('input').forEach(function (inp) { data[inp.name] = inp.value.trim(); if (inp.required && !inp.value.trim()) { ok = false; inp.focus(); } });
      if (ok && s.querySelector('input[name=phone]') && !validPhone(data.phone)) { ok = false; s.querySelector('input[name=phone]').focus(); }
      if (!ok) return;
    }
    if (i < steps.length - 1) { i++; show(); return; }
    window.slvSendLead({ name: data.name, phone: String(data.phone).replace(/\D/g, '').slice(-10), loc: data.loc, plot: data.plot, floors: data.floors, when: data.when, topic: 'Dream Home Planner' }, function () {
      pl.querySelector('.pwrap').style.display = 'none'; pl.querySelector('.thanks').style.display = 'block';
    });
  };
  show();
})();

/* area / city modal */
(function () {
  var AREAS = ['South Bengaluru', 'Uttarahalli', 'BSK / Banashankari', 'Thurahalli', 'Gubbalala', 'Kanakapura Road', 'Chikkegowdanapalya', 'Other South Bengaluru', 'Outside Bengaluru'];
  function get() { try { return localStorage.getItem('slvArea') || 'South Bengaluru'; } catch (e) { return 'South Bengaluru'; } }
  function apply() {
    var a = get();
    document.querySelectorAll('[data-area]').forEach(function (e) { e.textContent = a; });
    document.querySelectorAll('select.areasel').forEach(function (s) { s.value = a; });
    var es = document.getElementById('estLoc'); if (es) es.dispatchEvent(new Event('areachange'));
    var cm = document.querySelectorAll('.cmod .copt'); cm.forEach(function (b) { b.classList.toggle('on', b.dataset.v === a); });
  }
  function set(a) { try { localStorage.setItem('slvArea', a); } catch (e) { } apply(); }
  document.querySelectorAll('select.areasel').forEach(function (s) {
    AREAS.forEach(function (a) { var o = document.createElement('option'); o.textContent = a; o.value = a; s.appendChild(o); });
    s.onchange = function () { set(s.value); };
  });
  var m = document.createElement('div'); m.className = 'cmod'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'cmt');
  m.innerHTML = '<div class="cmb"><h3 id="cmt">Choose your area</h3><p>We build across South Bengaluru. Package pricing is indicative and confirmed after a plot review.</p><div class="cgrid2">' +
    AREAS.map(function (a) { return '<button type="button" class="copt" data-v="' + a + '"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>' + a + '</span></button>'; }).join('') +
    '</div><div class="cnote">Outside Bengaluru? Choose it and we will confirm coverage when you contact us.</div><button type="button" class="ccancel">Cancel</button></div>';
  document.body.appendChild(m);
  function open() { m.classList.add('on'); document.body.style.overflow = 'hidden'; var f = m.querySelector('.copt.on') || m.querySelector('.copt'); if (f) f.focus(); }
  function close() { m.classList.remove('on'); document.body.style.overflow = ''; }
  m.addEventListener('click', function (e) { if (e.target === m || e.target.classList.contains('ccancel')) close(); });
  m.querySelectorAll('.copt').forEach(function (b) { b.onclick = function () { set(b.dataset.v); close(); }; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && m.classList.contains('on')) close(); });
  var cb = document.getElementById('cityBtn'); if (cb) cb.onclick = open;
  document.querySelectorAll('[data-city-open]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); open(); }); });
  apply();
})();
