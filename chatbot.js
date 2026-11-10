/* SLV Assistant - guided chatbot (no backend needed).
   Leads go through slvSendLead() in site.js (WhatsApp by default, or CONFIG.leadEndpoint). */
(function () {
  var PHONE = '+91 74111 13053', TEL = 'tel:+917411113053';
  var TYPES = ['Residential construction (G+1)', 'Residential construction (G+2 / G+3)', 'Structural design & planning', 'Construction consulting', 'Site supervision'];

  /* ---------- knowledge base ---------- */
  var KB = [
    { k: /\b(hi|hello|hey|namaste|good (morning|evening|afternoon))\b/, a: function () { return 'Hello! I am the SLV Infra Tech assistant. Ask me about our services, projects and process, or leave your details for a free estimate.'; } },
    { k: /service|what (do|can) you|offer|do you (do|build)|expertise|special/, a: function () { return 'We specialise in G+1, G+2 and G+3 residential construction across South Bengaluru, plus structural design & planning, construction consulting and site supervision - all with BBMP-compliant documentation.'; } },
    { k: /g\+?1|g\+?2|g\+?3|floor|storey|duplex|villa|house|home|residential|independent/, a: function () { return 'Yes - we build G+1, G+2 and G+3 residential buildings, from foundation to terrace. Share your plot details and we will prepare a plan and estimate.'; }, lead: true },
    { k: /structur|design|drawing|plan|bbmp|approval|sanction|document/, a: function () { return 'We handle structural design and planning, and our work follows BBMP-compliant documentation from foundation to terrace.'; } },
    { k: /consult|advice|guidance/, a: function () { return 'We offer construction consulting - honest guidance on design, budget, materials and process before you start building.'; } },
    { k: /supervis|inspection|monitor|quality/, a: function () { return 'We provide site supervision, and our two directors personally oversee every project from structural design through handover.'; } },
    { k: /project|portfolio|work|built|completed|ongoing|progress|site|update/, a: function () { return 'See our completed and ongoing sites, including the Gubbalala G+3 build, on the Projects page: <a href="projects.html">View projects</a>.'; } },
    { k: /price|cost|rate|per ?sq|sqft|sq\.? ?ft|budget|quote|quotation|estimate|how much/, a: function () { var pk = (window.CONFIG && CONFIG.packages || []).map(function (p) { return parseFloat(p.rate); }).filter(Boolean); var r = pk.length ? ' Our packages range from ₹' + Math.min.apply(0, pk).toLocaleString('en-IN') + ' to ₹' + Math.max.apply(0, pk).toLocaleString('en-IN') + ' per sq.ft. of built-up area (see <a href="packages.html">Packages</a>).' : ''; return 'Cost depends on your plot, floors, specifications and finishes.' + r + ' Leave your details and the team will prepare a free estimate.'; }, lead: true },
    { k: /time|long|duration|month|schedule|deliver|handover|complete/, a: function () { return 'Timelines depend on the number of floors, design and approvals. We share a schedule after reviewing your plot and plan.'; } },
    { k: /where|address|location|area|bangalore|bengaluru|bsk|thurahalli|gubbalala|chikke/, a: function () { return 'We build across South Bengaluru - our sites include BSK 6th Stage (Thurahalli), Gubbalala and Chikkegowdanapalya. Office hours: Monday - Saturday, 9:00 AM to 6:00 PM.'; } },
    { k: /phone|call|number|contact|reach|whatsapp|talk/, a: function () { return 'Call Punith Venkatesh on <a href="' + TEL + '">' + PHONE + '</a> (Mon - Sat, 9 AM - 6 PM). Or leave your details here.'; }, lead: true },
    { k: /punith|venkatesh|founder|owner|director|who|team|since|established|2022/, a: function () { return 'SLV Infra Tech was founded in 2022 by Punith Venkatesh and Venkatesh S. Both directors personally oversee every project - no middlemen.'; } },
    { k: /commercial|infrastructure|compound|road|drain/, a: function () { return 'Commercial construction and infrastructure works (roads, compound walls, drainage) are coming soon. Contact us to register your requirement.'; }, lead: true },
    { k: /thank|thanks|ok|great|nice|bye/, a: function () { return 'You are welcome! Anything else I can help with?'; } }
  ];
  var FALLBACK = 'I am not sure about that one. You can ask about our services, projects, location or process - or leave your details and the directors will call you.';

  /* ---------- SLV logo avatar, mood driven by CSS (hi / bored / excited) ---------- */
  function avatar() {
    return '<img class="av logo" src="logo-icon.png" alt="" aria-hidden="true">';
  }

  /* ---------- UI ---------- */
  var root = document.createElement('div'); root.id = 'kvbot';
  root.innerHTML =
    '<button class="kb-launch" id="kbL" aria-label="Chat with SLV Assistant">' + avatar('kbc1') + '</button>' +
    '<div class="kb-tip" id="kbT"><span id="kbS">Hi! 👋</span></div>' +
    '<section class="kb-win" id="kbW" aria-label="SLV Assistant chat" hidden>' +
    '<header><span class="kb-av">' + avatar('kbc2') + '</span><div><b>SLV Assistant</b><small><i></i>Online · replies instantly</small></div><button id="kbX" aria-label="Close chat">×</button></header>' +
    '<div class="kb-msgs" id="kbM" aria-live="polite"></div>' +
    '<div class="kb-chips" id="kbC"></div>' +
    '<form class="kb-in" id="kbF"><input id="kbI" autocomplete="off" placeholder="Type your message…" aria-label="Message"><button aria-label="Send">➤</button></form>' +
    '</section>';
  document.body.appendChild(root);
  var $ = function (id) { return document.getElementById(id); };
  var win = $('kbW'), msgs = $('kbM'), chips = $('kbC'), inp = $('kbI'), tip = $('kbT');
  var flow = null, lead = {}, started = false;

  /* mood cycle: hi -> bored -> excited */
  var MOODS = [['hi', 'Hi! 👋'], ['bored', 'Bored… talk to me 😴'], ['excited', 'Let’s build! 🎉']], mi = 0;
  function setMood(m) {
    root.setAttribute('data-mood', m);
    for (var i = 0; i < MOODS.length; i++) if (MOODS[i][0] === m) { $('kbS').textContent = MOODS[i][1]; mi = i; }
  }
  setMood('hi');
  if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(function () { if (!win.hidden) return; mi = (mi + 1) % MOODS.length; setMood(MOODS[mi][0]); }, 3600);
  }

  function add(html, who, raw) {
    var d = document.createElement('div'); d.className = 'kb-m ' + who;
    if (raw) d.textContent = html; else d.innerHTML = html;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  function bot(html, cb, delay) {
    var t = document.createElement('div'); t.className = 'kb-m bot kb-typing'; t.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight;
    setTimeout(function () { t.remove(); add(html, 'bot'); if (cb) cb(); }, delay || 550);
  }
  function setChips(list) {
    chips.innerHTML = '';
    list.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = c.t;
      b.onclick = function () { userSays(c.t, c.go); }; chips.appendChild(b);
    });
  }
  function mainChips() {
    setChips([{ t: 'Our services' }, { t: 'Projects' }, { t: 'Get an estimate', go: 'lead' }, { t: 'Where do you build?' }, { t: 'Call us' }]);
  }
  function open() {
    win.hidden = false; root.classList.add('open'); tip.style.display = 'none'; setMood('hi');
    if (!started) {
      started = true;
      add('Hi! 👋 I am the <b>SLV Infra Tech</b> assistant. How can I help you today?', 'bot');
      mainChips();
    }
    setTimeout(function () { inp.focus(); }, 50);
  }
  function close() { win.hidden = true; root.classList.remove('open'); tip.style.display = 'block'; }
  $('kbL').onclick = function () { win.hidden ? open() : close(); };
  $('kbX').onclick = close;
  tip.addEventListener('click', open);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !win.hidden) close(); });
  window.slvOpenChat = open;
  document.querySelectorAll('[data-chat]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); open(); }); });

  /* ---------- lead flow ---------- */
  var STEPS = [
    { key: 'service', q: 'Great – which service do you need?', chips: TYPES, ok: function (v) { return v.length > 1; } },
    { key: 'loc', q: 'Where is the plot / site located? (area or locality)', ok: function (v) { return v.length > 1; }, err: 'Please share the area or locality of your plot.' },
    { key: 'name', q: 'May I have your name?', ok: function (v) { return /[a-z]{2,}/i.test(v); }, err: 'Please enter your name.' },
    { key: 'phone', q: 'And your 10-digit mobile number so our team can call you?', ok: function (v) { return /^[6-9]\d{9}$/.test(v.replace(/\D/g, '').slice(-10)) && v.replace(/\D/g, '').length >= 10; }, err: 'That does not look like a valid 10-digit Indian mobile number. Please try again.', fix: function (v) { return v.replace(/\D/g, '').slice(-10); } },
    { key: 'note', q: 'Anything else we should know – size, budget, timeline? (type “skip” to continue)', ok: function () { return true; }, fix: function (v) { return /^skip$/i.test(v) ? '' : v; } }
  ];
  var si = 0;
  function startLead() { flow = 'lead'; lead = {}; si = 0; ask(); }
  function ask() {
    var s = STEPS[si];
    bot(s.q, function () {
      if (s.chips) setChips(s.chips.map(function (t) { return { t: t }; })); else chips.innerHTML = '';
      if (s.key === 'note') setChips([{ t: 'skip' }]);
      inp.focus();
    });
  }
  function answerStep(v) {
    var s = STEPS[si];
    if (!s.ok(v)) { bot(s.err || 'Could you rephrase that?', null, 350); return; }
    lead[s.key] = s.fix ? s.fix(v) : v; si++;
    if (si < STEPS.length) { ask(); return; }
    chips.innerHTML = '';
    bot('Thanks, <b>' + esc(lead.name) + '</b>! Please confirm:<br>• Service: ' + esc(lead.service) + '<br>• Plot: ' + esc(lead.loc) + '<br>• Phone: +91 ' + esc(lead.phone) + (lead.note ? '<br>• Notes: ' + esc(lead.note) : ''), function () {
      setChips([{ t: 'Yes, submit', go: 'submit' }, { t: 'Start over', go: 'lead' }]);
    });
    flow = 'confirm';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function submit() {
    chips.innerHTML = '';
    window.slvSendLead(lead, function (st) {
      if (st === 'sent') bot('✅ Your enquiry has been sent. Our team will call you on +91 ' + esc(lead.phone) + ' shortly. Anything else?', mainChips);
      else if (st === 'wa') bot('WhatsApp should open with your details ready – please press <b>Send</b> so the directors receive them. You can also call <a href="' + TEL + '">' + PHONE + '</a>.', mainChips);
      else bot('Sorry, I could not send that just now. Please call <a href="' + TEL + '">' + PHONE + '</a>.', mainChips);
    });
    flow = null;
  }

  /* ---------- message handling ---------- */
  function userSays(text, go) {
    add(text, 'user', true); inp.value = '';
    if (go === 'lead') { startLead(); return; }
    if (go === 'submit') { submit(); return; }
    if (flow === 'lead') { if (/^(cancel|stop|exit)$/i.test(text)) { flow = null; bot('No problem – ask me anything else.', mainChips); return; } answerStep(text); return; }
    if (flow === 'confirm') {
      if (/^(yes|y|ok|submit|confirm)/i.test(text)) { submit(); return; }
      if (/^(no|start|edit|change)/i.test(text)) { startLead(); return; }
    }
    var t = text.toLowerCase();
    if (/quote|estimate|enquir|inquir|book|talk to|call me|callback|contact me|get in touch/.test(t)) { startLead(); return; }
    if (/call us|call you/.test(t)) { bot('Call Punith on <a href="' + TEL + '">' + PHONE + '</a> (Mon–Sat, 9–6). Or tap “Get an estimate” and we will call you.', function () { setChips([{ t: 'Get an estimate', go: 'lead' }, { t: 'Our services' }]); }); return; }
    for (var i = 0; i < KB.length; i++) {
      if (KB[i].k.test(t)) {
        var item = KB[i];
        bot(item.a(), function () { setChips(item.lead ? [{ t: 'Get an estimate', go: 'lead' }, { t: 'Projects' }] : [{ t: 'Get an estimate', go: 'lead' }, { t: 'Our services' }, { t: 'Projects' }]); });
        return;
      }
    }
    bot(FALLBACK, function () { setChips([{ t: 'Get an estimate', go: 'lead' }, { t: 'Our services' }, { t: 'Call us' }]); });
  }
  $('kbF').addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value.trim(); if (v) userSays(v); });

})();
