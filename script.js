const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const pricingSheetUrl = '';
let pricing = {};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(value.trim()); value = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; value = '';
    } else value += character;
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  if (!rows.length) return {};
  const headers = rows.shift().map((header) => header.toLowerCase());
  return Object.fromEntries(rows.map((cells) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
    return [record.slug, record];
  }).filter(([slug, record]) => slug && record.visible.toLowerCase() !== 'false'));
}

async function loadPricing() {
  if (!pricingSheetUrl) return {};
  const response = await fetch(`${pricingSheetUrl}${pricingSheetUrl.includes('?') ? '&' : '?'}_=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Pricing sheet request failed: ${response.status}`);
  return parseCsv(await response.text());
}

const priceMarkup = (slug) => {
  const item = pricing[slug];
  if (!item?.price && !item?.price_label) return '';
  return `<span class="price-tag">${escapeHtml(item.price_label || item.price)}</span>`;
};

function applyHomePricing() {
  document.querySelectorAll('[data-pricing-slug]').forEach((element) => {
    const item = pricing[element.dataset.pricingSlug];
    if (!item?.price && !item?.price_label) return;
    element.textContent = item.price_label || item.price;
    element.hidden = false;
  });
}

function closeDropdowns(except = null) {
  document.querySelectorAll('.nav-dropdown[open]').forEach((dropdown) => {
    if (dropdown !== except) dropdown.open = false;
  });
}

function setupExclusiveDropdowns() {
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener('toggle', () => {
      if (dropdown.open) closeDropdowns(dropdown);
    });
  });
}

const closeOnOutsideInteraction = (event) => {
  if (!event.target.closest('.nav-dropdown')) closeDropdowns();
};

document.addEventListener('click', closeOnOutsideInteraction);
document.addEventListener('pointerdown', closeOnOutsideInteraction);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDropdowns();
});

toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  if (!open) closeDropdowns();
  toggle.setAttribute('aria-expanded', open);
});

document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}));

document.querySelector('#quote-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const lastSubmit = localStorage.getItem('lastFormSubmit');
  const now = Date.now();
  const cooldown = 5000;
  if (lastSubmit && (now - parseInt(lastSubmit)) < cooldown) {
    alert('Asteapta cateva secunde inainte de a trimite o noua solicitare.');
    return;
  }
  localStorage.setItem('lastFormSubmit', now.toString());
  const data = new FormData(form);
  const subject = encodeURIComponent(`Solicitare ofertă - ${data.get('project') || 'proiect nou'}`);
  const body = encodeURIComponent([
    `Nume: ${data.get('name')}`,
    `Contact: ${data.get('contact')}`,
    `Tip proiect: ${data.get('project') || 'Nespecificat'}`,
    '',
    `Detalii: ${data.get('message') || 'Nespecificate'}`,
  ].join('\n'));
  const message = form.querySelector('.form-success');
  message.classList.add('show');
  window.location.href = `mailto:office@prelateindustriale.ro?subject=${subject}&body=${body}`;
});

const productPages = {
  'prelate-industriale': { kicker: 'Produse / Prelate industriale', title: 'Protecție adaptată ritmului tău de lucru.', lead: 'Prelate, închideri și structuri textile pentru depozitare, producție, utilaje și zone de lucru.', image: 'industrial-hall.jpg', items: ['Corturi industriale și hale temporare', 'Prelate de protecție pentru utilaje', 'Pereți de separare și menținere climat', 'Paravane și huse tehnice'] },
  'prelate-auto': { kicker: 'Produse / Prelate auto', title: 'Pregătite pentru fiecare kilometru.', lead: 'Prelate realizate la dimensiune pentru camioane, remorci, bene și transport special.', image: 'truck-tarpaulin.jpg', items: ['Prelate camioane și remorci', 'Prelate pentru bene de cereale', 'Prelate pentru bene de agregate', 'Reparații și înlocuiri rapide'] },
  copertine: { kicker: 'Produse / Copertine', title: 'Spații protejate, fără să pierzi lumina.', lead: 'Copertine fixe, retractabile sau sezoniere pentru locuințe, terase și spații comerciale.', image: 'canopy.jpg', items: ['Copertine fixe și mobile', 'Copertine pentru terase', 'Închideri cu folie transparentă', 'Copertine policarbonat'] },
  'acoperiri-spatii-comerciale': { kicker: 'Produse / Spații comerciale', title: 'Mai mult spațiu pentru afacerea ta.', lead: 'Acoperiri și structuri care protejează spațiile comerciale, evenimentele și zonele exterioare.', image: 'commercial-cover.jpg', items: ['Corturi de grădină și pavilioane', 'Acoperiri piețe și terase', 'Chioșcuri și tonete', 'Scene și spații pentru evenimente'] },
  'confectii-metalice': { kicker: 'Produse / Confecții metalice', title: 'Structura bună începe cu precizie.', lead: 'Confecții metalice care susțin o lucrare făcută pentru utilizare intensă și termen lung.', image: 'metal-structure.jpg', items: ['Structuri pentru copertine', 'Cadre și sisteme de prindere', 'Structuri pentru hale temporare', 'Elemente metalice la comandă'] },
  'arhitectura-textila': { kicker: 'Produse / Arhitectură textilă', title: 'Formă curată. Funcție serioasă.', lead: 'Soluții textile care definesc spații și oferă protecție, fără construcții greoaie.', image: 'textile-architecture.jpg', items: ['Membrane și tensostructuri', 'Acoperiri cu deschidere mare', 'Sisteme de umbrire', 'Soluții pe proiect'] },
};

const servicePages = {
  consultanta: { title: 'Începem cu întrebările potrivite.', lead: 'Analizăm spațiul, utilizarea și condițiile de montaj înainte de a propune soluția tehnică potrivită.', image: 'service-consultanta.jpg', visual: 'Măsurători & analiză tehnică', steps: ['Discuție despre proiect', 'Măsurători și analiză tehnică', 'Propunere de materiale și sistem', 'Ofertă clară, adaptată lucrării'] },
  montaj: { title: 'Montaj făcut să rămână pe poziție.', lead: 'Echipa noastră montează fiecare lucrare cu atenție la structură, prinderi și finisaje.', image: 'service-montaj.jpg', visual: 'Structură & instalare', steps: ['Planificarea montajului', 'Pregătirea structurii', 'Montajul în condiții de siguranță', 'Verificare și predare'] },
  intretinere: { title: 'Îngrijire simplă pentru o durată de viață mai mare.', lead: 'O verificare la momentul potrivit păstrează materialele și sistemele de prindere în stare bună.', image: 'service-intretinere.jpg', visual: 'Verificare & protecție', steps: ['Inspecție vizuală', 'Curățare și întreținere material', 'Verificarea punctelor de prindere', 'Recomandări pentru utilizare'] },
  reparatii: { title: 'Reparații rapide, când timpul contează.', lead: 'Intervenim pentru deteriorări ale prelatelor, copertinelor și elementelor de susținere.', image: 'service-reparatii.png', visual: 'Intervenții la material', steps: ['Evaluarea deteriorării', 'Identificarea intervenției necesare', 'Reparație în atelier sau la locație', 'Verificare finală'] },
  inscriptionari: { title: 'Prelate care îți poartă numele mai departe.', lead: 'Inscripționăm prelate auto și structuri textile cu grafica potrivită pentru flota sau brandul tău.', image: 'service-inscriptionari.jpg', visual: 'Personalizare flotă', steps: ['Pregătirea graficii', 'Alegerea materialului de print', 'Aplicare atentă', 'Finisare durabilă'] },
};

const seoPages = {
  home: { title: 'Prelate industriale, auto și copertine | Pirat Industrial', description: 'Pirat Industrial produce prelate industriale și auto, copertine și structuri textile. Consultanță și montaj la nivel național.' },
  produse: { title: 'Produse | Prelate, copertine și structuri textile | Pirat Industrial', description: 'Descoperă gama Pirat Industrial: prelate industriale și auto, copertine, acoperiri comerciale, confecții metalice și arhitectură textilă.' },
  servicii: { title: 'Servicii | Consultanță, montaj și reparații | Pirat Industrial', description: 'Consultanță, montaj, întreținere, reparații și inscripționări pentru prelate, copertine și structuri textile.' },
  media: { title: 'Proiecte realizate | Pirat Industrial', description: 'Vezi o selecție de lucrări Pirat Industrial: prelate industriale, prelate auto, copertine și structuri textile.' },
  'galerie-foto': { title: 'Galerie foto | Pirat Industrial', description: 'Galerie foto cu proiecte de prelate industriale, prelate auto și copertine realizate de Pirat Industrial.' },
  'galerie-video': { title: 'Galerie video | Pirat Industrial', description: 'Lucrări și proiecte Pirat Industrial în format video.' },
  contact: { title: 'Contact | Pirat Industrial', description: 'Contactează Pirat Industrial pentru prelate industriale și auto, copertine și structuri textile. Aleea Sinaia nr. 54, Viforâta, Dâmbovița.' },
};

function applySeo(pageId) {
  const page = seoPages[pageId] || productPages[pageId] || servicePages[pageId];
  if (!page) return;
  const title = page.title.includes('| Pirat Industrial') ? page.title : `${page.title} | Pirat Industrial`;
  const description = page.description || page.lead;
  const url = `https://www.prelateindustriale.ro/${pageId === 'home' ? '' : `${pageId}.html`}`;
  document.title = title;
  let descriptionTag = document.querySelector('meta[name="description"]');
  if (!descriptionTag) { descriptionTag = document.createElement('meta'); descriptionTag.name = 'description'; document.head.append(descriptionTag); }
  descriptionTag.content = description;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
  canonical.href = url;
  let structuredData = document.querySelector('#business-schema');
  if (!structuredData) { structuredData = document.createElement('script'); structuredData.id = 'business-schema'; structuredData.type = 'application/ld+json'; document.head.append(structuredData); }
  structuredData.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'Pirat Industrial', url: 'https://www.prelateindustriale.ro/', email: 'office@prelateindustriale.ro', telephone: '+40722750179', faxNumber: '+40245219197', areaServed: { '@type': 'Country', name: 'Romania' }, address: { '@type': 'PostalAddress', streetAddress: 'Aleea Sinaia nr. 54, Viforâta', addressLocality: 'Aninoasa', addressRegion: 'Dâmbovița', addressCountry: 'RO' }, sameAs: ['https://www.facebook.com/prelateindustriale.ro'] });
}

const imagePath = (image) => `assets/images/${image}`;
const sharedNav = () => `
  <header class="site-header"><a class="brand" href="index.html"><span class="brand-mark"><i></i><i></i><i></i></span><span>PIRAT<span class="brand-light">/ INDUSTRIAL</span></span></a>
  <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav"><span></span><span></span><span></span><b>Meniu</b></button>
  <nav class="main-nav" id="main-nav" aria-label="Navigare principală"><details class="nav-dropdown"><summary>Produse</summary><div class="dropdown-menu"><a href="prelate-industriale.html">Prelate industriale</a><a href="prelate-auto.html">Prelate auto</a><a href="copertine.html">Copertine</a><a href="acoperiri-spatii-comerciale.html">Acoperiri comerciale</a><a href="confectii-metalice.html">Confecții metalice</a><a href="arhitectura-textila.html">Arhitectură textilă</a></div></details><details class="nav-dropdown"><summary>Servicii</summary><div class="dropdown-menu"><a href="consultanta.html">Consultanță</a><a href="montaj.html">Montaj</a><a href="intretinere.html">Întreținere</a><a href="reparatii.html">Reparații</a><a href="inscriptionari.html">Inscripționări</a></div></details><details class="nav-dropdown"><summary>Media</summary><div class="dropdown-menu"><a href="galerie-foto.html">Galerie foto</a><a href="galerie-video.html">Galerie video</a></div></details><a href="contact.html">Contact</a><a class="nav-phone" href="tel:+40722750179">0722 750 179</a><a class="button button-small" href="contact.html">Cere ofertă <span>↗</span></a></nav></header>`;
const sharedFooter = () => `<footer class="site-footer"><div class="layout footer-top"><a class="brand" href="index.html"><span class="brand-mark"><i></i><i></i><i></i></span><span>PIRAT<span class="brand-light">/ INDUSTRIAL</span></span></a><a href="mailto:office@prelateindustriale.ro">office@prelateindustriale.ro <span>↗</span></a></div><div class="layout footer-bottom"><p>© 2026 Pirat Industrial. Toate drepturile rezervate.</p><p>Târgoviște, România</p><a href="#top">Înapoi sus ↑</a></div></footer>`;
const contactDetails = () => `<div class="contact-details"><p class="contact-detail-label">Contact direct</p><a href="mailto:office@prelateindustriale.ro">office@prelateindustriale.ro</a><a href="mailto:alin.bercu@prelateindustriale.ro">alin.bercu@prelateindustriale.ro</a><p><strong>Telefon:</strong> <a href="tel:+40722750179">0722.750.179</a></p><p><strong>Fax:</strong> 0245.219.197</p></div>`;
const contactBlock = () => `<section class="inner-cta"><div class="layout"><p class="eyebrow light">Următorul pas</p><h2>Spune-ne ce vrei să protejezi.</h2><a class="button" href="contact.html">Solicită o ofertă <span>↗</span></a></div></section>`;
const productCards = () => Object.entries(productPages).map(([slug, page], index) => `<a class="mini-card" href="${slug}.html"><span>0${index + 1}</span><img src="${imagePath(page.image)}" alt="" loading="lazy" decoding="async" /><h3>${page.kicker.split(' / ')[1]}</h3>${priceMarkup(slug)}<p>${page.lead}</p><b>Descoperă ↗</b></a>`).join('');
const serviceCards = () => Object.entries(servicePages).map(([slug, page], index) => `<a class="mini-card service-mini" href="${slug}.html"><span>0${index + 1}</span><img src="${imagePath(page.image)}" alt="" loading="lazy" decoding="async" /><span class="service-caption">${page.visual}</span><h3>${slug[0].toUpperCase() + slug.slice(1)}</h3>${priceMarkup(slug)}<p>${page.lead}</p><b>Descoperă ↗</b></a>`).join('');
const mapBlock = () => `<section class="map-section"><div class="layout map-layout"><div><p class="eyebrow">Ne găsești aici</p><h2>Vizitează-ne în Viforâta.</h2><p>Aleea Sinaia nr. 54, loc. Viforâta, comuna Aninoasa, județul Dâmbovița - la intrarea în Târgoviște.</p><a class="text-link" href="https://www.google.com/maps/search/?api=1&query=XF22%2B5M+Vifor%C3%A2ta%2C+Romania" target="_blank" rel="noopener">Deschide în Google Maps <span>↗</span></a></div><iframe title="Harta Pirat Industrial" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=XF22%2B5M+Vifor%C3%A2ta%2C+Romania&output=embed"></iframe></div></section>`;

function renderInnerPage(pageId) {
  applySeo(pageId);
  let main = '';
  if (productPages[pageId]) {
    const page = productPages[pageId];
    main = `<main id="top"><section class="inner-hero"><div class="layout"><p class="eyebrow">${page.kicker}</p><h1>${page.title}</h1><p>${page.lead}</p>${priceMarkup(pageId)}</div></section><section class="detail layout"><img src="${imagePath(page.image)}" alt="" /><div><p class="eyebrow">Ce putem realiza</p><h2>Adaptat proiectului tău.</h2><p>Fiecare produs este stabilit după dimensiunile, condițiile de expunere și felul în care spațiul va fi utilizat. Alegem soluția care își face treaba bine, nu doar pe cea care arată bine pe hârtie.</p><ul class="check-list">${page.items.map((item) => `<li>${item}</li>`).join('')}</ul><a class="text-link" href="contact.html">Discută cu noi despre proiect <span>↗</span></a></div></section>${contactBlock()}</main>`;
  } else if (servicePages[pageId]) {
    const page = servicePages[pageId];
    main = `<main id="top"><section class="inner-hero service-hero"><div class="layout"><p class="eyebrow">Servicii / ${pageId}</p><h1>${page.title}</h1><p>${page.lead}</p>${priceMarkup(pageId)}</div></section><section class="detail process layout"><div><p class="eyebrow">Cum lucrăm</p><h2>Clar de la început până la final.</h2><p>Un proiect bun rămâne simplu atunci când fiecare etapă este făcută în ordinea potrivită.</p></div><ol class="process-list">${page.steps.map((step, index) => `<li><span>0${index + 1}</span>${step}</li>`).join('')}</ol></section>${contactBlock()}</main>`;
  } else if (pageId === 'produse' || pageId === 'servicii') {
    const products = pageId === 'produse';
    main = `<main id="top"><section class="inner-hero"><div class="layout"><p class="eyebrow">${products ? 'Produse' : 'Servicii'}</p><h1>${products ? 'Soluții construite pentru condiții reale.' : 'Alături de proiect, de la idee la montaj.'}</h1><p>${products ? 'Explorăm fiecare proiect pornind de la utilizarea lui concretă.' : 'Aducem claritate tehnică și grijă pentru execuție în fiecare etapă.'}</p></div></section><section class="listing layout"><p class="eyebrow">${products ? 'Categorii de produse' : 'Serviciile noastre'}</p><div class="mini-grid">${products ? productCards() : serviceCards()}</div></section>${contactBlock()}</main>`;
  } else if (pageId === 'media' || pageId === 'galerie-foto' || pageId === 'galerie-video') {
    const video = pageId === 'galerie-video';
    main = `<main id="top"><section class="inner-hero"><div class="layout"><p class="eyebrow">Media</p><h1>${video ? 'Lucrări în mișcare.' : pageId === 'galerie-foto' ? 'Galerie foto' : 'Lucrări pe care le poți vedea.'}</h1><p>O selecție din proiectele noastre pentru spații industriale, transport și exterior.</p></div></section><section class="listing layout"><div class="media-links"><a href="galerie-foto.html">Galerie foto ↗</a><a href="galerie-video.html">Galerie video ↗</a></div>${video ? '<div class="video-note"><span>▶</span><p>Materialele video sunt în curs de actualizare. Pentru exemple relevante proiectului tău, contactează-ne direct.</p></div>' : `<div class="gallery-grid"><img src="${imagePath('industrial-hall.jpg')}" alt="Lucrare industrială" /><img src="${imagePath('truck-tarpaulin.jpg')}" alt="Prelată auto" /><img src="${imagePath('canopy.jpg')}" alt="Copertină" /></div>`}</section>${contactBlock()}</main>`;
  } else if (pageId === 'contact') {
    main = `<main id="top"><section class="inner-hero"><div class="layout"><p class="eyebrow">Contact</p><h1>Începem cu o conversație.</h1><p>Trimite-ne câteva detalii sau sună-ne direct. Revenim rapid cu întrebările potrivite.</p></div></section><section class="contact layout"><div class="contact-intro"><p class="eyebrow">Date de contact</p><h2>Ai un proiect?<br /><em>Îl facem să țină.</em></h2><p>Lucrăm pentru proiecte din toată țara.</p><a class="phone-big" href="tel:+40722750179">0722 750 179 <span>↗</span></a>${contactDetails()}</div><form class="contact-form" id="quote-form"><label>Numele tău<input required name="name" type="text" placeholder="Ex. Andrei Popescu" /></label><label>Telefon sau e-mail<input required name="contact" type="text" placeholder="Cum te putem contacta?" /></label><label>Tipul proiectului<select name="project"><option value="">Alege o categorie</option><option>Prelate industriale</option><option>Prelate auto</option><option>Copertine & terase</option><option>Structuri speciale</option></select></label><label>Detalii despre proiect<textarea name="message" rows="3" placeholder="Dimensiuni, locație, termen estimat..."></textarea></label><button class="button" type="submit">Trimite solicitarea <span>↗</span></button><p class="form-note">Prin trimitere, ești de acord să te contactăm în legătură cu această solicitare.</p><p class="form-success" role="status">Se deschide aplicația ta de e-mail pentru a trimite solicitarea.</p></form></section></main>`;
  }
  document.body.innerHTML = `${sharedNav()}${main}${sharedFooter()}`;
  if (pageId === 'contact') document.querySelector('main').insertAdjacentHTML('beforeend', mapBlock());
  wireInteractions();
}

function wireInteractions() {
  setupExclusiveDropdowns();
  const pageToggle = document.querySelector('.menu-toggle');
  const pageNav = document.querySelector('.main-nav');
  pageToggle?.addEventListener('click', () => { const open = pageNav.classList.toggle('open'); if (!open) closeDropdowns(); pageToggle.setAttribute('aria-expanded', open); });
  document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => { pageNav?.classList.remove('open'); pageToggle?.setAttribute('aria-expanded', 'false'); }));
  document.querySelector('#quote-form')?.addEventListener('submit', (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const subject = encodeURIComponent(`Solicitare ofertă - ${data.get('project') || 'proiect nou'}`);
    const body = encodeURIComponent([`Nume: ${data.get('name')}`, `Contact: ${data.get('contact')}`, `Tip proiect: ${data.get('project') || 'Nespecificat'}`, '', `Detalii: ${data.get('message') || 'Nespecificate'}`].join('\n'));
    form.querySelector('.form-success').classList.add('show'); window.location.href = `mailto:office@prelateindustriale.ro?subject=${subject}&body=${body}`;
  });
}

loadPricing().then((loadedPricing) => {
  pricing = loadedPricing;
  if (document.body.dataset.page) renderInnerPage(document.body.dataset.page);
  else {
    applySeo('home');
    setupExclusiveDropdowns();
    applyHomePricing();
  }
}).catch((error) => {
  console.error(error);
  if (document.body.dataset.page) renderInnerPage(document.body.dataset.page);
});
