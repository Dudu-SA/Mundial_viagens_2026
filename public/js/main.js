(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Barra de progresso + header com sombra + parallax do hero */
  const bar = document.createElement('div');
  bar.className = 'progress';
  document.body.prepend(bar);
  const header = document.querySelector('.header');
  const heroImg = document.querySelector('.hero__img');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle('scrolled', y > 10);
    if (heroImg && !reduce && y < innerHeight) heroImg.style.backgroundPositionY = `calc(50% + ${y * 0.12}px)`;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Link ativo no menu */
  const links = $('.nav a');
  if (location.pathname.includes('promocoes')) {
    links.find(a => a.getAttribute('href').includes('promocoes'))?.classList.add('active');
  } else {
    const map = new Map(links.map(a => [a.getAttribute('href').replace('#', ''), a]));
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { links.forEach(l => l.classList.remove('active')); map.get(e.target.id)?.classList.add('active'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    $('main section[id]').forEach(s => map.has(s.id) && spy.observe(s));
  }

  /* Avião que acompanha a rolagem */
  const plane = document.createElement('div');
  plane.className = 'plane';
  plane.setAttribute('aria-hidden', 'true');
  plane.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 12 3 3.5l2.6 8.5L3 20.5 21.5 12Zm-13.7 1.3L6.7 16.7 15 12.9 6.7 9l1.1 3.7h5.7v.6H7.8Z" fill-rule="evenodd"/></svg>';
  document.body.prepend(plane);

  /* Botão flutuante do WhatsApp (aparece após rolar) */
  const fab = document.createElement('a');
  fab.className = 'fab';
  fab.href = 'https://wa.me/558888870400?text=Ol%C3%A1%21%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20viagens.';
  fab.target = '_blank'; fab.rel = 'noopener';
  fab.setAttribute('aria-label', 'Chamar no WhatsApp');
  fab.innerHTML = '<span>Fale com a gente</span><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.300 1.200-1.800 1.200-.5.1-1 .2-3.300-.7-2.800-1.200-4.600-4-4.700-4.200-.1-.2-1.100-1.500-1.100-2.800s.7-2 1-2.300c.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 2c.1.2.1.400 0 .5l-.4.600c-.1.200-.3.300-.1.600.2.300.8 1.300 1.700 2.100 1.100 1 2.100 1.300 2.400 1.500.3.100.5.100.6-.1l.9-1.100c.2-.3.400-.2.600-.1l1.900.9c.3.100.5.200.5.300.1.200.1.800-.1 1.400Z"/></svg>';
  document.body.append(fab);
  const moveExtras = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    plane.style.transform = `translateX(${(max > 0 ? scrollY / max : 0) * (innerWidth - 26)}px)`;
    fab.classList.toggle('show', scrollY > 400);
  };
  addEventListener('scroll', moveExtras, { passive: true });
  moveExtras();

  /* Inclinação 3D nos cards de destino (só com mouse) */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $('.proj').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 8}deg`);
        c.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - .5) * 8}deg`);
      });
      c.addEventListener('pointerleave', () => { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); });
    });
  }

  if (reduce || !('IntersectionObserver' in window)) return;

  /* Entrada suave ao rolar (com escalonamento entre irmãos) */
  const targets = '.section-head h2, .contact__side h2, .stats div, .card, .proj, .steps__list li, blockquote';
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('in');
    io.unobserve(el);
    setTimeout(() => { el.removeAttribute('data-reveal'); el.classList.remove('in'); el.style.removeProperty('--d'); }, 1400);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $(targets).forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.matches(targets));
    el.style.setProperty('--d', `${(sibs.indexOf(el) % 4) * 0.09}s`);
    el.setAttribute('data-reveal', '');
    io.observe(el);
  });

  /* Contadores nos números */
  const count = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    count.unobserve(e.target);
    const el = e.target, m = el.textContent.match(/^(\d+)(.*)$/);
    if (!m) return;
    const end = +m[1], t0 = performance.now(), dur = 1400;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = v + m[2];
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  $('.stats strong').forEach(el => count.observe(el));
})();

/* ===== Formulário de contato: envia e-mail para mundialviagens2014@gmail.com (via FormSubmit),
   guarda cópia no Firestore (coleção "contatos") e tem plano B no WhatsApp ===== */
(() => {
  const f = document.querySelector('.contact__form');
  if (!f) return;
  const EMAIL_DESTINO = 'mundialviagens2014@gmail.com';
  const ok = f.querySelector('.form__ok'), btn = f.querySelector('button[type=submit]');

  const enviarEmail = async d => {
    // Requisição "simples" (FormData + no-cors): não gera preflight, então o bloqueio de CORS não atrapalha.
    // A resposta fica opaca (não dá para ler), então só sabemos que saiu sem erro de rede.
    const fd = new FormData();
    fd.append('_subject', 'Novo contato do site: ' + (d.destino || 'viagem') + ' - ' + d.nome);
    fd.append('_template', 'table');
    fd.append('_captcha', 'false');
    fd.append('_replyto', d.email);
    fd.append('email', d.email);
    fd.append('Nome', d.nome);
    fd.append('Telefone', d.tel || '-');
    fd.append('Destino desejado', d.destino || '-');
    fd.append('Mês da viagem', d.mes || '-');
    fd.append('Mensagem', d.msg || '-');
    await fetch('https://formsubmit.co/ajax/' + EMAIL_DESTINO, { method: 'POST', mode: 'no-cors', body: fd });
  };

  const salvarCopia = async d => {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore, collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const { firebaseConfig } = await import("./conexao.js");
    const db = getFirestore(initializeApp(firebaseConfig));
    await addDoc(collection(db, "contatos"), {
      nome: d.nome, telefone: d.tel, email: d.email,
      destino: d.destino, mes: d.mes, mensagem: d.msg,
      criadoEm: serverTimestamp()
    });
  };

  f.addEventListener('submit', async e => {
    e.preventDefault();
    const v = id => f.querySelector('#' + id).value.trim();
    const d = { nome: v('nome'), tel: v('tel'), email: v('email'), destino: v('destino'), mes: v('data'), msg: v('msg') };
    const txt = btn.textContent;
    ok.hidden = true; ok.style.color = '';
    btn.disabled = true; btn.textContent = 'Enviando…';

    const [email, copia] = await Promise.allSettled([enviarEmail(d), salvarCopia(d)]);
    if (email.status === 'rejected') console.error('[contato] e-mail falhou:', email.reason);
    if (copia.status === 'rejected') console.warn('[contato] cópia no Firestore falhou:', copia.reason);

    if (email.status === 'fulfilled') {
      ok.textContent = 'Mensagem enviada. Respondemos em até 24 horas.';
      f.reset();
    } else {
      const t = `Olá! Meu nome é ${d.nome}. Destino: ${d.destino || 'a definir'}${d.mes ? ' (' + d.mes + ')' : ''}. ${d.msg}${d.tel ? ' Telefone: ' + d.tel : ''}`;
      const a = document.createElement('a');
      a.href = 'https://wa.me/558888870400?text=' + encodeURIComponent(t);
      a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'enviar pelo WhatsApp';
      a.style.cssText = 'text-decoration:underline;font-weight:700';
      ok.textContent = 'Não conseguimos enviar agora. Toque para ';
      ok.append(a, '.');
      ok.style.color = '#ffe1da';
    }
    ok.hidden = false; btn.disabled = false; btn.textContent = txt;
  });
})();