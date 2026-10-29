const API_URL = "https://script.google.com/macros/s/AKfycbzkyDhnnTBOP2-nBvkm3MqZz9mK2dMRUYNa0Wu3P2qwYO2x56hXnZwt5g7jdeaIVKH92w/exec";

let siteConfig = {};

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

    renderExperiencias(data.EXPERIENCIAS || []);
    renderServicios(data.SERVICIOS || []);
    renderEspecialista(data.ESPECIALISTAS || []);
    renderProductos(data.PRODUCTOS || []);
    renderResenas(data.RESENAS || []);
    renderGaleria(data.GALERIA || []);

    if (loadingEl) loadingEl.style.display = "none";
  } catch (error) {
    console.error("Error al cargar datos:", error);
    if (loadingEl) {
      loadingEl.innerHTML = `<p class="text-center" style="color:#a33;">No fue posible sincronizar el contenido en este momento. Por favor contáctanos directamente a nuestro WhatsApp oficial.</p>`;
    }
  }
}

// Limpia y formatea fechas/horas de Google Sheets para evitar el timestamp ISO
function formatearHora(val) {
  if (!val) return "";
  const str = String(val).trim();
  if (str.includes("T")) {
    const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime())) {
      let hours = dateObj.getUTCHours();
      let minutes = dateObj.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    }
  }
  return str;
}

function formatearFecha(val) {
  if (!val) return "";
  const str = String(val).trim();
  if (str.includes("T")) {
    const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("es-CO", { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return str;
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

  // Botón flotante WhatsApp
  const btnWaFloat = document.getElementById("btn-wa-float");
  if (btnWaFloat) {
    const defaultMsg = encodeURIComponent("¡Hola! Deseo recibir información sobre las experiencias y servicios en Villa San Rafael.");
    btnWaFloat.href = `${baseWaUrl}${defaultMsg}`;
  }

  // Footer WhatsApp
  const footerWaNum = document.getElementById("footer-wa-number");
  const footerWaLink = document.getElementById("footer-wa-link");
  if (footerWaNum) footerWaNum.innerText = numVisible;
  if (footerWaLink) footerWaLink.href = `${baseWaUrl}${encodeURIComponent("¡Hola! Me gustaría comunicarme con Villa San Rafael.")}`;

  // Video Teaser
  if (cfg.url_video_lanzamiento) {
    const btnVideo = document.getElementById("btn-open-video");
    if (btnVideo) {
      btnVideo.style.display = "inline-block";
      btnVideo.onclick = () => abrirModalVideo(cfg.url_video_lanzamiento);
    }
  }

  // Mapa y Waze
  const mapIframe = document.getElementById("mapa-iframe");
  if (mapIframe && cfg.url_mapa_embed) mapIframe.src = cfg.url_mapa_embed;

  const btnWaze = document.getElementById("btn-waze");
  if (btnWaze && cfg.waze_maps_link) btnWaze.href = cfg.waze_maps_link;
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
        <div class="itinerario-box">
          <h4>Itinerario de la Jornada:</h4>
          <ul class="itinerario-lista">
            ${exp.itinerario.map(it => `
              <li>
                <span class="iti-hora">${formatearHora(it.Hora_Inicio)} - ${formatearHora(it.Hora_Fin)}</span>
                <strong>${it.Titulo_Jornada || ''}</strong>
                <p>${it.Descripcion_Actividad || ''}</p>
              </li>
            `).join("")}
          </ul>
        </div>
      `;
    }

    return `
      <article class="card card-experiencia">
        ${exp.Drive_URL_Imagen ? `<img src="${exp.Drive_URL_Imagen}" alt="${exp.Nombre_Retiro}" class="card-img" loading="lazy">` : ''}
        <div class="card-body">
          <span class="badge ${exp.Estado.toLowerCase() === 'abierta' ? 'badge-success' : 'badge-warning'}">${exp.Estado}</span>
          <h3>${exp.Nombre_Retiro}</h3>
          <p class="meta">📅 ${formatearFecha(exp.Fecha_Inicio)} | 👥 Cupos: ${exp.Cupo_Max || 'Limitados'}</p>
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

function renderServicios(items) {
  const container = document.getElementById("servicios-container");
  if (!container) return;

  const visibles = items.filter(it => it.Estado && it.Estado.toString().toLowerCase() !== "oculto");
  if (visibles.length === 0) {
    container.innerHTML = `<p class="text-center" style="grid-column: 1/-1; color:#777;">Servicios clínicos en actualización.</p>`;
    return;
  }

  container.innerHTML = visibles.map(srv => {
    let sesionesHtml = "";
    if (srv.sesiones && srv.sesiones.length > 0) {
      sesionesHtml = `
        <div class="sesiones-box">
          <h4>Estructura de las sesiones:</h4>
          <ul class="sesiones-lista">
            ${srv.sesiones.map(ses => `
              <li>
                <strong>Sesión ${ses.Numero_Sesion}:</strong> ${ses.Tipo_Terapia} (${ses.Espacio} - ${ses.Duracion_Minutos} min)
                <p>${ses.Enfoque_Sesion || ''}</p>
              </li>
            `).join("")}
          </ul>
        </div>
      `;
    }

    return `
      <div class="card card-servicio">
        <div class="card-body">
          <span class="badge badge-outline">${srv.Modalidad || 'Individual'} · ${srv.Total_Sesiones || 1} Sesión(es)</span>
          <h3>${srv.Nombre_Plan || 'Plan de Fisioterapia'}</h3>
          <p class="desc">${srv.Descripcion_General || ''}</p>
          ${sesionesHtml}
          <div class="card-footer">
            <span class="price">${srv.Valor_Plan ? `$${Number(srv.Valor_Plan).toLocaleString('es-CO')}` : 'A convenir'}</span>
            <button class="btn btn-secondary" onclick="abrirModalLead('Servicio: ${srv.Nombre_Plan || 'Fisioterapia'}')">Agendar Valoración</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderEspecialista(lista) {
  const container = document.getElementById("especialista-container");
  if (!container) return;

  const esp = lista.find(e => e.Estado && e.Estado.toString().toLowerCase() === "activo") || lista[0];
  if (!esp) {
    document.getElementById("especialista-section").style.display = "none";
    return;
  }

  const tags = (esp.Especialidades || "").split("·").map(t => `<span class="tag">${t.trim()}</span>`).join("");

  container.innerHTML = `
    <img src="${esp.Foto_URL}" alt="${esp.Nombre}" class="especialista-foto" loading="lazy">
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
    container.innerHTML = `<p class="text-center" style="grid-column: 1/-1; color:#777;">Catálogo botánico en preparación.</p>`;
    return;
  }

  container.innerHTML = disponibles.map(prod => {
    const numWhatsApp = siteConfig.whatsapp_numero || "573158272120";
    const msg = encodeURIComponent(`¡Hola! Deseo pedir el producto "${prod.Nombre_Producto}" (${prod.Presentacion || ''}).`);
    const waLink = `https://wa.me/${numWhatsApp}?text=${msg}`;

    return `
      <div class="card card-producto">
        ${prod.URL_Imagen ? `<img src="${prod.URL_Imagen}" alt="${prod.Nombre_Producto}" class="card-img" loading="lazy">` : ''}
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

  container.innerHTML = activas.map(r => `
    <div class="card-resena">
      <div class="resena-header">
        ${r.Foto_Avatar_URL ? `<img src="${r.Foto_Avatar_URL}" alt="${r.Nombre_Cliente}" class="resena-avatar">` : ''}
        <div>
          <h4>${r.Nombre_Cliente}</h4>
          <p>${r.Rol_Ciudad || ''} · <em>${r.Servicio_Tomado || ''}</em></p>
        </div>
      </div>
      <div class="resena-stars">★★★★★</div>
      <p class="resena-texto">“${r.Testimonio}”</p>
    </div>
  `).join("");
}

function renderGaleria(items) {
  const container = document.getElementById("galeria-container");
  if (!container) return;

  if (items.length === 0) {
    document.getElementById("galeria").style.display = "none";
    return;
  }

  container.innerHTML = items.map(m => `
    <img src="${m.URL_Recurso}" alt="${m.Titulo || 'Villa San Rafael'}" loading="lazy">
  `).join("");
}

/* Modal de Captura y WhatsApp Directo */
function abrirModalLead(interes) {
  document.getElementById("form-interes").value = interes;
  document.getElementById("modal-lead-title").innerText = interes.includes("Retiro") ? "Reservar Cupo" : "Agendar Valoración";
  document.getElementById("modal-lead-subtitle").innerText = `Déjanos tus datos para coordinar tu espacio en: ${interes}`;
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
        // Enviar a Google Sheets vía POST
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, telefono: tel, interes, mensaje })
        });
      } catch (err) {
        console.warn("Fallo secundario al escribir en Sheets:", err);
      }

      // Redirigir a WhatsApp con el mensaje enriquecido
      const numWhatsApp = siteConfig.whatsapp_numero || "573158272120";
      const textoWa = encodeURIComponent(`¡Hola! Mi nombre es ${nombre}. Acabo de solicitar información para: *${interes}*. Mi teléfono es ${tel}.${mensaje ? ' Nota: ' + mensaje : ''}`);
      window.open(`https://wa.me/${numWhatsApp}?text=${textoWa}`, "_blank");

      modalLead.style.display = "none";
      btnSubmit.innerText = "Continuar a WhatsApp";
      btnSubmit.disabled = false;
      leadForm.reset();
    };
  }

  // Modal Video
  const modalVideo = document.getElementById("modal-video");
  const btnCloseVideo = document.getElementById("btn-close-video");
  if (btnCloseVideo) {
    btnCloseVideo.onclick = () => {
      document.getElementById("video-iframe").src = "";
      modalVideo.style.display = "none";
    };
  }
}

function abrirModalVideo(url) {
  const modalVideo = document.getElementById("modal-video");
  const videoIframe = document.getElementById("video-iframe");
  videoIframe.src = url;
  modalVideo.style.display = "flex";
}
