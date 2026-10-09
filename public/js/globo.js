/* Globo 3D do hero: pontos de terra, rota a partir de Crateús e seletor de continentes.
   Usa three.js (CDN). Se o WebGL falhar, o hero continua funcionando só com o seletor. */
const MASK = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPj/z////3EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/++f///wcAAPADgAEAAOADAAAAAAAAAAAAAAAg3N4f/v///wcAAB8AAAAAAAA4AAAAAAAAAAAAAAADAOAH/P///wcAAA4AAAAAAAAwAAAAAAAAAAAAAAC8cQwBAP///wcAAAAAAIAHAMD/DwDwAAAAAAAAAOAAAAAAAPz//wMAAAAAAGAAAPz/AQAAAAAAAAAAAOBdc/MDAPj//wEAAAAAABjAwP///z9gAAAAA4AAAED8A/P/AOD//wEAAAAAADjg/v///z//HwCAAPj/A0/8X4PwB/D//wAAAOA/AADh/v///////wM+A/7///8Pw56BB+D/DwAAAPz/Y+zf/f//////////N/D///////+Bf/D/AQAAAP7/x////v//////////GP7//////7/wJ+AfAH4AAD9++P//////////////AOD//////88GH8AfAAwAwJ////////////////9/APz//////wNxDIAPAAAA8M///////////////98/APzf/////wHwAwAGAAAA+M///////////////+ADAPAB+P///wHwMwAAAAAA8A//////////////ZBgAAIACgP///wPgfwAAAAAQAAf///////////8fAA4AACAAAP///z/gfwAAAAAwYMf///////////8PAB8AAAQAAP7////5/wMAAABoQOj///////////8DAA8AAAAAgPz////5/wcAAADs+P////////////9/AAcAAAAAAPj////7/wMAAADg+f////////////9/AAEAAAAAAPj/////zwAAAAAw/v////////////+/AAAAAAAAAPD/////Gw4AAACg//////////////8fAAAAAAAAAOD/////HxAAAADA//////////////8fAAAAAAAAAOD//////wAAAACA//9P/vj///////8PAAAAAAAAAOD/////EwAAAACA//wHfPz////////HAAAAAAAAAOD/////AQAAAAD8g/EH8Pj////////gAAAAAAAAAOD/////AAAAAAD8Aebn+fH//////z8AAAAAAAAAAOD///9/AAAAAAD8AGT8//H//////xpgAAAAAAAAAMD///8/AAAAAAD8AMT8//H/////fzggAAAAAAAAAID///8fAAAAAABwdAD8/////////zE4AAAAAAAAAID///8fAAAAAACwfwBD/////////zA/AAAAAAAAAAD+//8PAAAAAAD4fwAA/////////wAHAAAAAAAAAAD8//8DAAAAAAD8/2OA/////////4EAAAAAAAAAAADo//8DAAAAAAD8/+///////////wEAAAAAAAAAAADo/wkCAAAAAAD+//////z//////wEAAAAAAAAAAADYfwACAAAAAID///8///n//////wEAAAAAAAAAAACgfwAWAAAAAMD///9//+H//////wAAAAAAAAAAAAAgfwAAAAAAAMD///9//jPg////fwAAAAAAAAAAAAAAfgAAAAAAAOD//////H/A////PwEAAAAAAAAAAAAAfAAIAAAAAOD//////f/A/+f/BwAAAAAAAAAAAAAAfDBwAAAAAOD/////+X8A/sN/AAAAAAAAAAAAAAAA+DgAAwAAAOD/////+T8A/oB/AwAAAAAAAAAAAAAA4B8AAAAAAOD/////8x8AfoB/AAMAAAAAAAAAAAAAgPwAAAAAAOD/////8wcAPoD+AAEAAAAAAAAAAAAAAPgBAAAAAOD/////7wEAHAD+AQEAAAAAAAAAAAAAAMAAAAAAAOD/////PwAAHAD8AQQAAAAAAAAAAAAAAICAAgAAAMD/////HwMAGADgAAoAAAAAAAAAAAAAAADBfgAAAID//////wMAGABAAAAAAAAAAAAAAAAAAADy/wAAAID//////wEAIAAGAAwAAAAAAAAAAAAAAADw/wEAAAD//////wEAIAAIAAgAAAAAAAAAAAAAAADw/x8AAAD8+P///wAAAAAZYAAAAAAAAAAAAAAAAADg/z8AAAAAwP///wAAAAAbMAAAAAAAAAAAAAAAAADw/z8AAAAAwP//fwAAAAAWfAAAAAAAAAAAAAAAAAD4/38AAAAAwP//HwAAAAAcficAAAAAAAAAAAAAAAD8//8BAAAAwP//DwAAAAAYPiABAAAAAAAAAAAAAAD8//8DAAAAwP//BwAAAAA4vgEaAAAAAAAAAAAAAAD8//8/AAAAgP//BwAAAABwEBL+AAAAAAAAAAAAAAD8////AAAAAP//AwAAAABgAADwAQAAAAAAAAAAAAD8////AQAAAP//AwAAAADABADyAwEAAAAAAAAAAAD4////AQAAAP7/AwAAAAAAHADwBgQAAAAAAAAAAADw////AAAAAP7/BwAAAAAAAAQADAAAAAAAAAAAAADw//9/AAAAAP7/BwAAAAAAAAAAAAAAAAAAAAAAAADg//9/AAAAAP7/BwAAAAAAAICHAAAAAAAAAAAAAADg//8/AAAAAP//BwEAAAAAANDHAAAAAAAAAAAAAADA//8/AAAAAP//hwMAAAAAAPjHAQAAAAAAAAAAAAAA//8/AAAAAP//4QEAAAAAAPzfAQAAAAAAAAAAAAAA/v8/AAAAAP//4AEAAAAAAP7/AwAAAAAAAAAAAAAA/v8fAAAAAP5/wAAAAAAAgP//ByAAAAAAAAAAAAAA/v8fAAAAAP7/4AAAAAAA4P//D0AAAAAAAAAAAAAA/v8HAAAAAPz/4AAAAAAA8P//HwAAAAAAAAAAAAAA/v8AAAAAAPx/YAAAAAAA8P//PwAAAAAAAAAAAAAA/v8AAAAAAPw/AAAAAAAA8P//PwAAAAAAAAAAAAAA/v8AAAAAAPw/AAAAAAAA8P//PwAAAAAAAAAAAAAA/38AAAAAAPgfAAAAAAAA4P//PwAAAAAAAAAAAAAA/z8AAAAAAPAPAAAAAAAA4P//PwAAAAAAAAAAAAAA/x8AAAAAAPAHAAAAAAAA4B/+PwAAAAAAAAAAAAAA/w8AAAAAAPABAAAAAAAA4Af0HwAAAAAAAAAAAAAA/wMAAAAAAAAAAAAAAAAAAADwDwAIAAAAAAAAAACA/wMAAAAAAAAAAAAAAAAAAADgDwAQAAAAAAAAAACA/wEAAAAAAAAAAAAAAAAAAADAAgBwAAAAAAAAAACAfwAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAACAHwAAAAAAAAAAAAAAAAAAAAAABgAQAAAAAAAAAACAHwAAAAAAAAAAAAAAAAAAAAAABgAMAAAAAAAAAADADwAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAADABwAAAAAAAAAAAAAAAAAAAAAAAIADAAAAAAAAAADADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAgwEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAADwAAAR4Pv4HAAAAAAAAAAAAAAAACAAAAAAAAAAA4P8/4P//////BwAAAAAAAAAAAAAAPwAAAAAAAADg//8//P///////wMAAAAAAAAAAACAewAAAADI/v////8///////////8BAAAAAAAAABAAeAAAAID///////////////////8DAAAAAAAe4P//fwAAAMD//////////////////38AAADA////////BwAAAPz//////////////////x8AAEDz//////8/AAAA8P///////////////////x8AABj///////8PAIAH/////////////////////38AAADA//////8/gPAD4P///////////////////wcAAAD+////////P4Dx/////////////////////w8AAAD8//////////////////////////////////8A/wMA/v//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";
const MW = 240, MH = 120;
const ORIGEM = { lat: -5.17, lon: -40.65 };               // Crateús - CE
const DESTINOS = [
  { id: "ac", nome: "América Central", lat: 15, lon: -88 },
  { id: "an", nome: "América do Norte", lat: 40, lon: -100 },
  { id: "as", nome: "América do Sul", lat: -15, lon: -60 },
  { id: "eu", nome: "Europa", lat: 48, lon: 15 },
  { id: "asia", nome: "Ásia", lat: 30, lon: 95 },
  { id: "af", nome: "África", lat: 5, lon: 20 }
];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const box = document.getElementById("globo");
if (box) iniciar();

function iniciar() {
  const sel = box.querySelector(".globo__sel"), nome = box.querySelector(".globo__nome span"),
        dist = box.querySelector(".globo__dist"), cta = box.querySelector(".globo__cta");
  let atual = 0, auto = !reduce, THREE = null;

  const rad = d => d * Math.PI / 180;
  const km = (a, b) => { const p = rad(b.lat - a.lat), l = rad(b.lon - a.lon),
    h = Math.sin(p / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(l / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h)); };

  DESTINOS.forEach((d, i) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = d.nome;
    b.onclick = () => { auto = false; box.classList.remove("auto"); escolher(i); };
    sel.append(b);
  });

  function escolher(i) {
    atual = i; const d = DESTINOS[i];
    [...sel.children].forEach((b, k) => b.classList.toggle("on", k === i));
    nome.textContent = d.nome;
    dist.textContent = "a cerca de " + (Math.round(km(ORIGEM, d) / 100) * 100).toLocaleString("pt-BR") + " km de Crateús";
    cta.href = "https://wa.me/558888870800?text=" + encodeURIComponent("Olá! Tenho interesse em viajar para " + d.nome + ". Pode me passar mais informações?");
    if (!reduce) nome.animate([{ transform: "translateY(105%)" }, { transform: "none" }], { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" });
    if (cena) cena.ir(d);
  }

  // o seletor avança sozinho enquanto a pessoa não mexe
  sel.addEventListener("animationend", e => { if (e.animationName === "rota-fill" && auto) escolher((atual + 1) % DESTINOS.length); });
  box.addEventListener("pointerenter", () => box.classList.add("paused"));
  box.addEventListener("pointerleave", () => box.classList.remove("paused"));
  if (auto) box.classList.add("auto");

  let cena = null;
  escolher(0);
  import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js")
    .then(m => { THREE = m; cena = montar(THREE); cena.ir(DESTINOS[atual]); box.classList.add("pronto"); })
    .catch(e => console.warn("[globo]", e));

  function montar(T) {
    const cv = box.querySelector("canvas");
    const r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    const sc = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, .1, 20); cam.position.set(0, 0, 4.5);
    const g = new T.Group(); sc.add(g);
    const xyz = (lat, lon, h = 1) => new T.Vector3(Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat)), Math.cos(rad(lat)) * Math.cos(rad(lon))).multiplyScalar(h);

    // oceano
    g.add(new T.Mesh(new T.SphereGeometry(.992, 64, 48), new T.MeshBasicMaterial({ color: 0xe4ebfa })));

    // terra em pontos (espiral de Fibonacci filtrada pela máscara)
    const bin = atob(MASK), land = (lat, lon) => {
      const x = Math.min(MW - 1, Math.floor((lon + 180) / 360 * MW)), y = Math.min(MH - 1, Math.floor((90 - lat) / 180 * MH)), k = y * MW + x;
      return (bin.charCodeAt(k >> 3) >> (k & 7)) & 1;
    };
    const pts = [], N = 9000;
    for (let i = 0; i < N; i++) {
      const lat = Math.asin(1 - 2 * (i + .5) / N) * 180 / Math.PI, lon = ((i * 137.508) % 360) - 180;
      if (land(lat, lon)) pts.push(xyz(lat, lon, 1));
    }
    const geo = new T.BufferGeometry().setFromPoints(pts);
    const mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { px: { value: r.getPixelRatio() * 3.2 } },
      vertexShader: "uniform float px; varying float f; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vec4 c=modelViewMatrix*vec4(0.,0.,0.,1.); f=normalize(mv.xyz-c.xyz).z; gl_PointSize=px*(.7+.5*f); gl_Position=projectionMatrix*mv; }",
      fragmentShader: "varying float f; void main(){ if(length(gl_PointCoord-.5)>.5||f<0.) discard; gl_FragColor=vec4(mix(vec3(.55,.66,.9),vec3(.07,.2,.5),smoothstep(0.,.9,f)),1.); }"
    });
    g.add(new T.Points(geo, mat));

    // origem
    const cor = 0xf2a33a, pO = xyz(ORIGEM.lat, ORIGEM.lon, 1.003);
    const pin = new T.Mesh(new T.SphereGeometry(.022, 16, 12), new T.MeshBasicMaterial({ color: cor })); pin.position.copy(pO); g.add(pin);
    const ring = (p, c) => { const m = new T.Mesh(new T.RingGeometry(.03, .036, 40), new T.MeshBasicMaterial({ color: c, transparent: true, side: T.DoubleSide, depthWrite: false })); m.position.copy(p); m.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), p.clone().normalize()); g.add(m); return m; };
    const ro = ring(pO, cor), rd = ring(new T.Vector3(), 0x1d4a9f);

    // rota + avião
    let curva = null, tubo = null, prog = 0, voo = 0;
    const aviao = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
      x.fillStyle = "#f2a33a"; x.beginPath(); x.moveTo(60, 32); x.lineTo(14, 8); x.lineTo(24, 28); x.lineTo(4, 32); x.lineTo(24, 36); x.lineTo(14, 56); x.closePath(); x.fill();
      const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: false, transparent: true })); s.scale.set(.11, .11, 1); s.renderOrder = 5; s.visible = false; g.add(s); return s; })();
    const rota = d => {
      if (tubo) { g.remove(tubo); tubo.geometry.dispose(); }
      const a = xyz(ORIGEM.lat, ORIGEM.lon), b = xyz(d.lat, d.lon), n = 64, v = [];
      const w = Math.acos(Math.min(1, a.dot(b)));
      for (let i = 0; i <= n; i++) { const t = i / n, s = Math.sin(w) || 1;
        const p = a.clone().multiplyScalar(Math.sin((1 - t) * w) / s).add(b.clone().multiplyScalar(Math.sin(t * w) / s));
        v.push(p.normalize().multiplyScalar(1.004 + Math.sin(Math.PI * t) * .08 * w)); }
      curva = new T.CatmullRomCurve3(v);
      tubo = new T.Mesh(new T.TubeGeometry(curva, 80, .0055, 6), new T.MeshBasicMaterial({ color: cor }));
      tubo.geometry.setDrawRange(0, 0); g.add(tubo);
      const pd = xyz(d.lat, d.lon, 1.003); rd.position.copy(pd); rd.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), pd.clone().normalize());
      prog = 0; voo = 0; aviao.visible = false;
    };

    // orientação: leva o ponto (lat, lon) para frente da câmera
    let cur = { x: rad(ORIGEM.lat) * .85, y: -rad(ORIGEM.lon) }, alvo = { x: 0, y: 0 }, arrasto = null, parado = 0;
    const mirar = (d, ao) => { alvo = { x: rad(d.lat) * .85, y: -rad(d.lon) };            // 0.85: inclina um pouco, dá mais volume
      if (ao) { let dy = alvo.y - cur.y; dy -= Math.round(dy / (2 * Math.PI)) * 2 * Math.PI; cur.y = alvo.y - dy; } };
    cv.addEventListener("pointerdown", e => { arrasto = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); auto = false; box.classList.remove("auto"); });
    cv.addEventListener("pointermove", e => { if (!arrasto) return;
      cur.y += (e.clientX - arrasto.x) * .006; cur.x = Math.max(-1, Math.min(1, cur.x + (e.clientY - arrasto.y) * .006));
      alvo = { ...cur }; arrasto = { x: e.clientX, y: e.clientY }; });
    const solta = () => { arrasto = null; }; cv.addEventListener("pointerup", solta); cv.addEventListener("pointercancel", solta);

    const ajustar = () => { const st = cv.parentElement, w = st.clientWidth, h = st.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      cam.position.z = w / h < 1 ? 4.5 / Math.min(1, w / h * 1.15) : 4.5; };
    new ResizeObserver(ajustar).observe(cv.parentElement); ajustar();

    let vis = true; new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) loop(); }).observe(cv.parentElement);
    const aponta = new T.Vector3(), tg = new T.Vector3(); let t0 = performance.now();
    function loop() {
      if (!vis) return; requestAnimationFrame(loop);
      const t = performance.now(), dt = Math.min(.05, (t - t0) / 1000); t0 = t;
      const k = reduce ? 1 : 1 - Math.pow(.0025, dt);                                       // suavização independente do fps
      let dy = alvo.y - cur.y; dy -= Math.round(dy / (2 * Math.PI)) * 2 * Math.PI;
      cur.y += dy * k; cur.x += (alvo.x - cur.x) * k;
      g.rotation.set(cur.x, cur.y, 0);
      if (curva) {
        prog = Math.min(1, prog + dt / (reduce ? .01 : 1.6));
        const e = 1 - Math.pow(1 - prog, 3), cnt = tubo.geometry.index.count;
        tubo.geometry.setDrawRange(0, Math.floor(cnt * e / 6) * 6);
        if (prog >= 1 && !reduce) { voo = (voo + dt / 5) % 1; const p = curva.getPointAt(voo); aviao.position.copy(p); aviao.visible = true;
          curva.getTangentAt(voo, tg); const a = p.clone(), b = p.clone().add(tg.multiplyScalar(.05));
          g.updateMatrixWorld(); a.applyMatrix4(g.matrixWorld).project(cam); b.applyMatrix4(g.matrixWorld).project(cam);
          aviao.material.rotation = Math.atan2(b.y - a.y, b.x - a.x); }
      }
      if (!reduce) { const s = (t / 1800) % 1; [ro, rd].forEach(m => { m.scale.setScalar(1 + s * 2.2); m.material.opacity = 1 - s; }); }
      r.render(sc, cam);
    }
    loop();
    return { ir: (d, imediato) => { rota(d); mirar(d, imediato); if (imediato || reduce) { cur = { ...alvo }; } } };
  }
}