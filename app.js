const API_URL = "https://script.google.com/macros/s/AKfycbzkyDhnnTBOP2-nBvkm3MqZz9mK2dMRUYNa0Wu3P2qwYO2x56hXnZwt5g7jdeaIVKH92w/exec";

let siteConfig = {};
let allServicios = [];
let allGaleria = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();
  setupFormEvents();
  setupVideoModal();
});

async function cargarDatos() {
  const loadingEl = document.getElementById("loading");
  try {
    const res = await fetch(API_URL, { method: "GET", redirect: "follow" });
    const data = await res.json();

    if (data.error) {
      throw new Error(data.mensaje || "Error en payload de API");
    }

    siteConfig = data.CONFIG || {};
    aplicarConfiguracion(siteConfig);

    allServicios = data.SERVICIOS || [];
    renderServicios(allServicios);

    renderExperiencias(data.EXPERIENCIAS || []);
    renderEspecialista(data.ESPECIALISTAS || []);
    renderProductos(data.PRODUCTOS || []);
    
    // Galería con fallback local controlado
    allGaleria = (data.GALERIA && data.GALERIA.length > 0) ? data.GALERIA : [
      { URL_Recurso: "assets/Imagenes/galeria-rio.jpg", Titulo: "Sendero y aguas vivas en El Pomo", Categoria: "naturaleza" },
      { URL_Recurso: "assets/Imagenes/galeria-huerta.jpg", Titulo: "Cultivo y plantas medicinales", Categoria: "naturaleza" },
      { URL_Recurso: "assets/Imagenes/galeria-almuerzo.jpg", Titulo: "Alimentación consciente de la casa", Categoria: "encuentros" },
      { URL_Recurso: "assets/Imagenes/hero-bg.jpg", Titulo: "Vista panorámica al atardecer", Categoria: "paisajes" }
    ];
    renderGaleria(allGaleria);

    renderResenas(data.RESENAS || []);

    if (loadingEl) loadingEl.style.display = "none";
  } catch (error) {
    console.error("Fallo al sincronizar datos:", error);
    if (loadingEl) {
      loadingEl.innerHTML = `<p class="text-center" style="color:#777; padding:1.5rem;">Atención en línea disponible directamente a través de nuestro WhatsApp oficial.</p>`;
    }
  }
}

function formatearHora(val) {
  if (!val) return "";
  const str = String(val).trim();
  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      let h = d.getUTCHours();
      let m = d.getUTCMinutes();
      m = Math.round(m / 15) * 15;
      if (m === 60) { h += 1; m = 0; }
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${m < 10 ? '0' + m : m} ${ampm}`;
    }
  }
  return str;
}

function formatearFecha(val) {
  if (!val) return "";
  const str = String(val).trim();
  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("es-CO", { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return str;
}

function obtenerIniciales(nombre) {
  if (!nombre) return "VR";
  const partes = nombre.trim().split(" ");
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function aplicarConfiguracion(cfg) {
  const numWhatsApp = cfg.whatsapp_numero || "573158272120";
  const numVisible = cfg.whatsapp_texto_visible || "(+57) 315 827 2120";
  const baseWaUrl = `https://wa.me/${numWhatsApp}?text=`;

  if (cfg.titulo_sitio) document.title = cfg.titulo_sitio;
  
  const siteTitleEl = document.getElementById("site-title");
  if (siteTitleEl && cfg.titulo_sitio) siteTitleEl.innerText = cfg.titulo_sitio;

  const welcomeEl = document.getElementById("hero-welcome");
  if (welcomeEl && cfg.mensaje_bienvenida) welcomeEl.innerText = cfg.mensaje_bienvenida;

  const socialProofEl = document.getElementById("hero-social-proof");
  if (socialProofEl && cfg.subtitulo_social) socialProofEl.innerText = cfg.subtitulo_social;

  const locEl = document.getElementById("site-location");
  if (locEl && cfg.ubicacion) locEl.innerText = `📍 ${cfg.ubicacion}`;

  const btnWaFloat = document.getElementById("btn-wa-float");
  if (btnWaFloat) {
    btnWaFloat.href = `${baseWaUrl}${encodeURIComponent("¡Hola! Deseo recibir información sobre las experiencias y servicios en Villa San Rafael.")}`;
  }

  const footerWaNum = document.getElementById("footer-wa-number");
  const footerWaLink = document.getElementById("footer-wa-link");
  if (footerWaNum) footerWaNum.innerText = numVisible;
  if (footerWaLink) footerWaLink.href = `${baseWaUrl}${encodeURIComponent("¡Hola! Me gustaría comunicarme con Villa San Rafael.")}`;

  const mapIframe = document.getElementById("mapa-iframe");
  if (mapIframe && cfg.url_mapa_embed) {
    mapIframe.src = cfg.url_mapa_embed;
  }

  const btnWaze = document.getElementById("btn-waze");
  if (btnWaze && cfg.waze_maps_link) {
    btnWaze.href = cfg.waze_maps_link;
  }
}

// 1. Retiros Femeninos (Consume exp.Drive_URL_Imagen de la API)
function renderExperiencias(items) {
  const container = document.getElementById("experiencias-container");
  if (!container) return;

  const activas = items.filter(it => it.Estado && it.Estado.toString().toLowerCase() !== "oculto");
  if (activas.length === 0) {
    container.innerHTML = `<p class="text-center" style="grid-column: 1/-1; color:#777;">Próximamente anunciaremos nuevas fechas de retiros.</p>`;
    return;
  }

  container.innerHTML = activas.map(exp => {
    let itinerarioHtml = "";
    if (exp.itinerario && exp.itinerario.length > 0) {
      itinerarioHtml = `
        <div class="itinerario-abierto-box">
          <h4>Itinerario Programado de la Jornada</h4>
          <ul class="iti-timeline">
            ${exp.itinerario.map(it => `
              <li class="iti-item">
                <span class="iti-badge-hora">${formatearHora(it.Hora_Inicio)} - ${formatearHora(it.Hora_Fin)}</span>
                <div class="iti-text">
                  <strong>${it.Titulo_Jornada || ''}</strong>
                  <p>${it.Descripcion_Actividad || ''}</p>
                </div>
              </li>
            `).join("")}
          </ul>
        </div>
      `;
    }

    // Prioriza imagen de Sheets / API, con fallback local
    const imagenRetiro = exp.Drive_URL_Imagen || "assets/Imagenes/retiro-pomo.jpg";

    return `
      <article class="card-experiencia-destacada">
        <div class="exp-foto-wrapper">
          <img src="${imagenRetiro}" alt="${exp.Nombre_Retiro}" onerror="this.onerror=null; this.src='assets/Imagenes/hero-bg.jpg';" loading="lazy">
        </div>
        <div class="card-body">
          <span class="badge ${exp.Estado.toLowerCase() === 'abierta' ? 'badge-success' : 'badge-warning'}">${exp.Estado}</span>
          <h3>${exp.Nombre_Retiro}</h3>
          <p class="meta">📅 <strong>${formatearFecha(exp.Fecha_Inicio)}</strong> | 👥 Quedan pocos cupos (Máx ${exp.Cupo_Max || '10'})</p>
          <p class="desc">${exp.Descripcion_Corta || ''}</p>
          
          ${itinerarioHtml}

          <div class="card-footer">
            <span class="price">${exp.Valor_Total ? `$${Number(exp.Valor_Total).toLocaleString('es-CO')}` : 'Consultar'}</span>
            <button class="btn btn-primary" onclick="abrirModalRetiro('${exp.Nombre_Retiro}')">Consultar Cupo</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// 2. Fisioterapia Clínica (Sesiones anidadas mediante ID_Plan)
function filtrarServicios(categoria) {
  document.querySelectorAll("#servicios-tabs .tab-btn").forEach(btn => btn.classList.remove("active"));
  if (window.event && window.event.target) window.event.target.classList.add("active");

  if (categoria === 'todos') {
    renderServicios(allServicios);
  } else {
    const filtrados = allServicios.filter(s => (s.Modalidad || '').toLowerCase() === categoria.toLowerCase());
    renderServicios(filtrados);
  }
}

function renderServicios(items) {
  const container = document.getElementById("servicios-container");
  if (!container) return;

  const visibles = items.filter(it => it.Estado && it.Estado.toString().toLowerCase() !== "oculto");
  if (visibles.length === 0) {
    container.innerHTML = `<p class="text-center" style="grid-column: 1/-1; color:#777; padding: 1.5rem;">No hay servicios en esta categoría.</p>`;
    return;
  }

  container.innerHTML = visibles.map(srv => {
    let sesionesHtml = "";
    if (srv.sesiones && srv.sesiones.length > 0) {
      sesionesHtml = `
        <details class="acordeon-box">
          <summary>Ver estructura de las ${srv.sesiones.length} sesiones ▸</summary>
          <ul class="acordeon-lista">
            ${srv.sesiones.map(ses => `
              <li>
                <strong>Sesión ${ses.Numero_Sesion}:</strong> ${ses.Tipo_Terapia} (${ses.Espacio} - ${ses.Duracion_Minutos}m)
                ${ses.Enfoque_Sesion ? `<p style="font-size:0.8rem; color:#666;">${ses.Enfoque_Sesion}</p>` : ''}
              </li>
            `).join("")}
          </ul>
        </details>
      `;
    }

    const planNombre = srv.Nombre_Plan || srv.Nombre_Servicio || 'Plan de Fisioterapia';
    const totalSes = srv.Total_Sesiones || (srv.sesiones ? srv.sesiones.length : 1);
    const etiquetaSesiones = totalSes === 1 ? '1 sesión' : `${totalSes} sesiones`;

    return `
      <div class="card-servicio-horizontal">
        <div class="servicio-img-wrapper">
          <img src="assets/Imagenes/fisioterapia.jpg" alt="${planNombre}" onerror="this.onerror=null; this.src='assets/Imagenes/hero-bg.jpg';" loading="lazy">
        </div>
        <div class="card-body">
          <span class="badge badge-outline">${srv.Modalidad || 'Individual'} · ${etiquetaSesiones}</span>
          <h3>${planNombre}</h3>
          <p class="desc">${srv.Descripcion_General || 'Evaluación funcional, descompresión neuromuscular y terapia manual en camilla campestre.'}</p>
          
          <div class="card-mini-resena">
            <strong>★★★★★</strong> “Mi molestia lumbar disminuyó notablemente desde la primera sesión con vista a las montañas.”
          </div>

          ${sesionesHtml}

          <div class="card-footer">
            <span class="price">${srv.Valor_Plan ? `$${Number(srv.Valor_Plan).toLocaleString('es-CO')}` : 'A convenir'}</span>
            <button class="btn btn-secondary" onclick="abrirModalFisio('${planNombre}')">Agendar Valoración</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// 3. Especialista (Blanca Esther Perdomo)
function renderEspecialista(lista) {
  const container = document.getElementById("especialista-container");
  if (!container) return;

  const esp = lista.find(e => e.Estado && e.Estado.toString().toLowerCase() === "activo") || lista[0];
  if (!esp) {
    document.getElementById("especialista").style.display = "none";
    return;
  }

  const tags = (esp.Especialidades || "").split("·").map(t => `<span class="tag">${t.trim()}</span>`).join("");
  const fotoEsp = esp.Foto_URL || 'assets/Imagenes/blanca-perdomo.jpg';

  container.innerHTML = `
    <div class="especialista-avatar-wrapper">
      <img src="${fotoEsp}" alt="${esp.Nombre}" class="especialista-foto" onerror="this.onerror=null; this.src='assets/Imagenes/hero-bg.jpg';" loading="lazy">
    </div>
    <div class="especialista-info">
      <h3>${esp.Nombre}</h3>
      <p class="titulo">${esp.Titulo_Profesional} · ${esp.Experiencia_Anos}</p>
      <p class="bio">${esp.Biografia_Corta}</p>
      <div class="especialista-tags">${tags}</div>
    </div>
  `;
}

// 4. Catálogo Botánico (Consume prod.URL_Imagen de la API)
function renderProductos(items) {
  const container = document.getElementById("productos-container");
  if (!container) return;

  const disponibles = items.filter(it => it.Disponibilidad && it.Disponibilidad.toString().toLowerCase() !== "oculto");
  if (disponibles.length === 0) {
    container.innerHTML = `<p class="text-center" style="grid-column: 1/-1; color:#777; padding:1.5rem;">Catálogo botánico en preparación.</p>`;
    return;
  }

  container.innerHTML = disponibles.map(prod => {
    const numWhatsApp = siteConfig.whatsapp_numero || "573158272120";
    const msg = encodeURIComponent(`¡Hola! Deseo consultar disponibilidad del producto botánico "${prod.Nombre_Producto}" (${prod.Presentacion || ''}).`);
    const waLink = `https://wa.me/${numWhatsApp}?text=${msg}`;
    const fotoProd = prod.URL_Imagen || "assets/Imagenes/mantequilla.jpg";

    return `
      <div class="card-producto">
        <div class="card-producto-img-box">
          <img src="${fotoProd}" alt="${prod.Nombre_Producto}" onerror="this.onerror=null; this.src='assets/Imagenes/hero-bg.jpg';" loading="lazy">
        </div>
        <div class="card-body">
          <h3>${prod.Nombre_Producto}</h3>
          <p class="desc">${prod.Beneficio_Clave || ''}</p>
          <p class="meta">🧴 Contenido: ${prod.Presentacion || '100g'}</p>
          <div class="card-footer">
            <span class="price">${prod.Precio ? `$${Number(prod.Precio).toLocaleString('es-CO')}` : 'Consultar'}</span>
            <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-primary">Pedir por WhatsApp</a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// 5. Galería Mosaico con Lightbox
function filtrarGaleria(categoria) {
  document.querySelectorAll("#galeria-tabs .tab-btn").forEach(btn => btn.classList.remove("active"));
  if (window.event && window.event.target) window.event.target.classList.add("active");

  if (categoria === 'todos') {
    renderGaleria(allGaleria);
  } else {
    const filtrados = allGaleria.filter(g => (g.Categoria || '').toLowerCase() === categoria.toLowerCase());
    renderGaleria(filtrados);
  }
}

function renderGaleria(items) {
  const container = document.getElementById("galeria-container");
  if (!container) return;

  container.innerHTML = items.map(m => `
    <div class="galeria-item" onclick="abrirLightbox('${m.URL_Recurso}', '${m.Titulo || 'Villa San Rafael'}')">
      <img src="${m.URL_Recurso}" alt="${m.Titulo || ''}" loading="lazy">
      <div class="galeria-overlay">
        <span>${m.Titulo || 'Ver imagen'}</span>
      </div>
    </div>
  `).join("");
}

function abrirLightbox(src, caption) {
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox-caption").innerText = caption;
  document.getElementById("modal-lightbox").style.display = "flex";
}

function cerrarLightbox() {
  document.getElementById("modal-lightbox").style.display = "none";
}

// 6. Reseñas
function renderResenas(items) {
  const container = document.getElementById("resenas-container");
  if (!container) return;

  const activas = items.filter(it => it.Estado && it.Estado.toString().toLowerCase() === "activo");
  if (activas.length === 0) {
    document.getElementById("resenas").style.display = "none";
    return;
  }

  container.innerHTML = activas.map(r => {
    const numEstrellas = Math.min(5, Math.max(1, parseInt(r.Calificacion, 10) || 5));
    const estrellas = "★".repeat(numEstrellas) + "☆".repeat(5 - numEstrellas);
    const iniciales = obtenerIniciales(r.Nombre_Cliente);
    const fechaLimpia = formatearFecha(r.Fecha);

    const texto = r.Testimonio || "";
    const partes = texto.split(".");
    const titular = partes[0] ? partes[0] + "." : texto;
    const cuerpo = partes.slice(1).join(".").trim();

    return `
      <div class="card-resena">
        <div class="resena-meta-top">
          <span class="resena-stars">${estrellas}</span>
          ${fechaLimpia ? `<span class="resena-fecha">${fechaLimpia}</span>` : '<span class="resena-fecha">Reseña verificada</span>'}
        </div>
        <div class="resena-header">
          <div class="resena-avatar-initials">${iniciales}</div>
          <div>
            <h4>${r.Nombre_Cliente}</h4>
            <span class="resena-tag-servicio">${r.Servicio_Tomado || 'Experiencia'}</span>
          </div>
        </div>
        <div class="resena-texto">
          <strong>“${titular}”</strong>
          ${cuerpo ? `<p>${cuerpo}</p>` : ''}
        </div>
      </div>
    `;
  }).join("");
}

// Control de Modales Adaptados
function abrirModalRetiro(nombreRetiro) {
  document.getElementById("retiro-interes").value = nombreRetiro;
  document.getElementById("modal-retiro-title").innerText = `Consultar Cupo: ${nombreRetiro}`;
  document.getElementById("modal-retiro").style.display = "flex";
}

function abrirModalFisio(nombrePlan) {
  document.getElementById("fisio-interes").value = nombrePlan;
  document.getElementById("modal-fisio-title").innerText = `Agendar: ${nombrePlan}`;
  document.getElementById("modal-fisio").style.display = "flex";
}

function cerrarModales() {
  document.getElementById("modal-retiro").style.display = "none";
  document.getElementById("modal-fisio").style.display = "none";
  document.getElementById("modal-video").style.display = "none";
}

function setupFormEvents() {
  const formRetiro = document.getElementById("form-retiro");
  if (formRetiro) {
    formRetiro.onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("retiro-nombre").value;
      const tel = document.getElementById("retiro-tel").value;
      const cupos = document.getElementById("retiro-cupos").value;
      const interes = document.getElementById("retiro-interes").value;
      const mensaje = document.getElementById("retiro-mensaje").value;

      try {
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, telefono: tel, interes: `Retiro: ${interes} (${cupos})`, mensaje })
        });
      } catch (err) {
        console.warn("Fallo secundario al registrar lead:", err);
      }

      const numWhatsApp = siteConfig.whatsapp_numero || "573158272120";
      const textoWa = encodeURIComponent(`¡Hola! Mi nombre es ${nombre}. Deseo consultar disponibilidad para el retiro *${interes}* para *${cupos}*. Mi teléfono es ${tel}.${mensaje ? ' Nota: ' + mensaje : ''}`);
      window.open(`https://wa.me/${numWhatsApp}?text=${textoWa}`, "_blank");

      cerrarModales();
      formRetiro.reset();
    };
  }

  const formFisio = document.getElementById("form-fisio");
  if (formFisio) {
    formFisio.onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("fisio-nombre").value;
      const tel = document.getElementById("fisio-tel").value;
      const horario = document.getElementById("fisio-horario").value;
      const interes = document.getElementById("fisio-interes").value;
      const mensaje = document.getElementById("fisio-mensaje").value;

      try {
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, telefono: tel, interes: `Fisio: ${interes} (${horario})`, mensaje })
        });
      } catch (err) {
        console.warn("Fallo secundario al registrar lead:", err);
      }

      const numWhatsApp = siteConfig.whatsapp_numero || "573158272120";
      const textoWa = encodeURIComponent(`¡Hola! Mi nombre es ${nombre}. Deseo agendar una valoración para *${interes}* con preferencia horaria: *${horario}*. Mi contacto es ${tel}.${mensaje ? ' Motivo: ' + mensaje : ''}`);
      window.open(`https://wa.me/${numWhatsApp}?text=${textoWa}`, "_blank");

      cerrarModales();
      formFisio.reset();
    };
  }
}

function setupVideoModal() {
  const modalVideo = document.getElementById("modal-video");
  const btnClose = document.getElementById("btn-close-video");
  const videoPlayer = document.getElementById("video-player");
  const btnOpen = document.getElementById("btn-open-video");

  if (btnOpen) {
    btnOpen.onclick = () => {
      modalVideo.style.display = "flex";
      videoPlayer.play().catch(e => console.log("Interacción requerida para reproducción"));
    };
  }

  if (btnClose) {
    btnClose.onclick = () => {
      videoPlayer.pause();
      videoPlayer.currentTime = 0;
      modalVideo.style.display = "none";
    };
  }

  if (modalVideo) {
    modalVideo.onclick = (e) => {
      if (e.target === modalVideo) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        modalVideo.style.display = "none";
      }
    };
  }
}
