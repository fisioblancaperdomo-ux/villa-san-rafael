const API_URL = "https://script.google.com/macros/s/AKfycbzkyDhnnTBOP2-nBvkm3MqZz9mK2dMRUYNa0Wu3P2qwYO2x56hXnZwt5g7jdeaIVKH92w/exec";

let siteConfig = {};
let allServicios = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();
  setupModalEvents();
});

async function cargarDatos() {
  const loadingEl = document.getElementById("loading");
  try {
    const res = await fetch(API_URL, { method: "GET", redirect: "follow" });
    const data = await res.json();

    siteConfig = data.CONFIG || {};
    aplicarConfiguracion(siteConfig);

    allServicios = data.SERVICIOS || [];
    renderServicios(allServicios);

    renderExperiencias(data.EXPERIENCIAS || []);
    renderEspecialista(data.ESPECIALISTAS || []);
    renderProductos(data.PRODUCTOS || []);
    renderResenas(data.RESENAS || []);

    if (loadingEl) loadingEl.style.display = "none";
  } catch (error) {
    console.error("Error al cargar datos:", error);
    if (loadingEl) {
      loadingEl.innerHTML = `<p class="text-center" style="color:#a33; padding:1.5rem;">No fue posible sincronizar el contenido en este momento. Por favor contáctanos directamente a nuestro WhatsApp oficial.</p>`;
    }
  }
}

// Limpieza de horas para evitar timestamps ISO 1899-12-30T...
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

// Formateo de fechas legible (ej. 14 de nov de 2026)
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

  // WhatsApp Flotante
  const btnWaFloat = document.getElementById("btn-wa-float");
  if (btnWaFloat) {
    btnWaFloat.href = `${baseWaUrl}${encodeURIComponent("¡Hola! Deseo recibir información sobre las experiencias y servicios en Villa San Rafael.")}`;
  }

  // Footer WhatsApp
  const footerWaNum = document.getElementById("footer-wa-number");
  const footerWaLink = document.getElementById("footer-wa-link");
  if (footerWaNum) footerWaNum.innerText = numVisible;
  if (footerWaLink) footerWaLink.href = `${baseWaUrl}${encodeURIComponent("¡Hola! Me gustaría comunicarme con Villa San Rafael.")}`;

  // Botón de Video Teaser
  const btnVideo = document.getElementById("btn-open-video");
  if (btnVideo) {
    btnVideo.onclick = () => {
      const urlVideo = cfg.url_video_lanzamiento || "Video/PresentacionVillaSanRafael.mp4";
      abrirModalVideo(urlVideo);
    };
  }

  // Mapa embebido y Waze (BlaCes Project)
  const mapIframe = document.getElementById("mapa-iframe");
  if (mapIframe && cfg.url_mapa_embed) {
    mapIframe.src = cfg.url_mapa_embed;
  }

  const btnWaze = document.getElementById("btn-waze");
  if (btnWaze && cfg.waze_maps_link) {
    btnWaze.href = cfg.waze_maps_link;
  }
}

function filtrarServicios(categoria) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
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

    const planNombre = srv.Nombre_Plan || srv.Nombre_Servicio || 'Plan Terapéutico';
    const totalSes = srv.Total_Sesiones || 1;
    const etiquetaSesiones = totalSes === 1 ? '1 sesión' : `${totalSes} sesiones`;

    return `
      <div class="card card-servicio">
        <div class="card-body">
          <span class="badge badge-outline">${srv.Modalidad || 'Individual'} · ${etiquetaSesiones}</span>
          <h3>${planNombre}</h3>
          <p class="desc">${srv.Descripcion_General || ''}</p>
          
          <div class="card-mini-resena">
            <strong>★★★★★</strong> “Mi molestia lumbar disminuyó notablemente desde la primera sesión con vista a las montañas.”
          </div>

          ${sesionesHtml}

          <div class="card-footer">
            <span class="price">${srv.Valor_Plan ? `$${Number(srv.Valor_Plan).toLocaleString('es-CO')}` : 'A convenir'}</span>
            <button class="btn btn-secondary" onclick="abrirModalLead('Servicio: ${planNombre}')">Agendar Valoración</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

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

    const imagenRetiro = exp.Drive_URL_Imagen || 'assets/Imagenes/retiro-pomo.jpg';

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
            <button class="btn btn-primary" onclick="abrirModalLead('Retiro: ${exp.Nombre_Retiro}')">Reservar Cupo</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

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
    const msg = encodeURIComponent(`¡Hola! Deseo pedir el producto "${prod.Nombre_Producto}" (${prod.Presentacion || ''}).`);
    const waLink = `https://wa.me/${numWhatsApp}?text=${msg}`;
    const fotoProd = prod.URL_Imagen || 'assets/Imagenes/hero-bg.jpg';

    return `
      <div class="card card-producto">
        <img src="${fotoProd}" alt="${prod.Nombre_Producto}" class="card-img" onerror="this.onerror=null; this.src='assets/Imagenes/hero-bg.jpg';" loading="lazy">
        <div class="card-body">
          <h3>${prod.Nombre_Producto}</h3>
          <p class="desc">${prod.Beneficio_Clave || ''}</p>
          <p class="meta">🧴 ${prod.Presentacion || ''}</p>
          <div class="card-footer">
            <span class="price">${prod.Precio ? `$${Number(prod.Precio).toLocaleString('es-CO')}` : ''}</span>
            <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-primary">Pedir por WhatsApp</a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderResenas(items) {
  const container = document.getElementById("resenas-container");
  if (!container) return;

  const activas = items.filter(it => it.Estado && it.Estado.toString().toLowerCase() === "activo");
  if (activas.length === 0) {
    document.getElementById("testimonios").style.display = "none";
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

function abrirModalLead(interes) {
  document.getElementById("form-interes").value = interes;
  document.getElementById("modal-lead-title").innerText = interes.includes("Retiro") ? "Reservar Cupo" : "Agendar Valoración";
  document.getElementById("modal-lead-subtitle").innerText = `Déjanos tus datos para coordinar en: ${interes}`;
  document.getElementById("modal-lead").style.display = "flex";
}

function setupModalEvents() {
  const modalLead = document.getElementById("modal-lead");
  const btnClose = document.getElementById("btn-close-modal");
  if (btnClose) btnClose.onclick = () => modalLead.style.display = "none";

  const leadForm = document.getElementById("lead-form");
  if (leadForm) {
    leadForm.onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("form-nombre").value;
      const tel = document.getElementById("form-telefono").value;
      const interes = document.getElementById("form-interes").value;
      const mensaje = document.getElementById("form-mensaje").value;

      const btnSubmit = document.getElementById("btn-submit-lead");
      btnSubmit.innerText = "Registrando...";
      btnSubmit.disabled = true;

      try {
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, telefono: tel, interes, mensaje })
        });
      } catch (err) {
        console.warn("Fallo al escribir en Sheets:", err);
      }

      const numWhatsApp = siteConfig.whatsapp_numero || "573158272120";
      const textoWa = encodeURIComponent(`¡Hola! Mi nombre es ${nombre}. Me interesa información y agendamiento para: *${interes}*. Mi teléfono es ${tel}.${mensaje ? ' Nota: ' + mensaje : ''}`);
      window.open(`https://wa.me/${numWhatsApp}?text=${textoWa}`, "_blank");

      modalLead.style.display = "none";
      btnSubmit.innerText = "Continuar a WhatsApp";
      btnSubmit.disabled = false;
      leadForm.reset();
    };
  }

  // Control Robusto del Modal de Video
  const modalVideo = document.getElementById("modal-video");
  const btnCloseVideo = document.getElementById("btn-close-video");
  const videoPlayer = document.getElementById("video-player");

  if (btnCloseVideo) {
    btnCloseVideo.onclick = () => {
      if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
      }
      modalVideo.style.display = "none";
    };
  }

  // Cerrar al hacer clic en el fondo oscuro
  if (modalVideo) {
    modalVideo.onclick = (e) => {
      if (e.target === modalVideo) {
        if (videoPlayer) {
          videoPlayer.pause();
          videoPlayer.currentTime = 0;
        }
        modalVideo.style.display = "none";
      }
    };
  }
}

function abrirModalVideo(url) {
  const modalVideo = document.getElementById("modal-video");
  const videoPlayer = document.getElementById("video-player");
  const videoIframe = document.getElementById("video-iframe");

  if (url.endsWith(".mp4") || url.includes("Video/")) {
    videoIframe.style.display = "none";
    videoPlayer.style.display = "block";
    videoPlayer.src = url;
    videoPlayer.play().catch(e => console.log("Autoplay bloqueado por el navegador:", e));
  } else {
    videoPlayer.style.display = "none";
    videoIframe.style.display = "block";
    videoIframe.src = url;
  }

  modalVideo.style.display = "flex";
}
