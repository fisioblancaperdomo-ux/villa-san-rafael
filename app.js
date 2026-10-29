// URL de la API Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbzkyDhnnTBOP2-nBvkm3MqZz9mK2dMRUYNa0Wu3P2qwYO2x56hXnZwt5g7jdeaIVKH92w/exec";

let siteConfig = {};

document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();
});

async function cargarDatos() {
  const loadingEl = document.getElementById("loading");
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    siteConfig = data.CONFIG || {};
    aplicarConfiguracion(siteConfig);

    renderExperiencias(data.EXPERIENCIAS || []);
    renderServicios(data.SERVICIOS || []);
    renderProductos(data.PRODUCTOS || []);
    renderGaleria(data.GALERIA || []);

    if (loadingEl) loadingEl.style.display = "none";
  } catch (error) {
    console.error("Error al cargar datos desde Google Sheets:", error);
    if (loadingEl) {
      loadingEl.innerHTML = `<p class="error-msg">No fue posible cargar el contenido en este momento. Por favor contáctanos directamente por WhatsApp.</p>`;
    }
  }
}

function aplicarConfiguracion(cfg) {
  const numWhatsApp = cfg.whatsapp_numero || "573158272120";
  const baseWaUrl = `https://wa.me/${numWhatsApp}?text=`;

  if (cfg.titulo_sitio) document.title = cfg.titulo_sitio;
  
  const siteTitleEl = document.getElementById("site-title");
  if (siteTitleEl && cfg.titulo_sitio) siteTitleEl.innerText = cfg.titulo_sitio;

  const welcomeEl = document.getElementById("hero-welcome");
  if (welcomeEl && cfg.mensaje_bienvenida) welcomeEl.innerText = cfg.mensaje_bienvenida;

  const locEl = document.getElementById("site-location");
  if (locEl && cfg.ubicacion) locEl.innerText = cfg.ubicacion;

  // Botón flotante de WhatsApp general
  const btnWaFloat = document.getElementById("btn-wa-float");
  if (btnWaFloat) {
    const defaultMsg = encodeURIComponent("¡Hola! Me gustaría recibir información sobre los servicios y retiros en Villa San Rafael.");
    btnWaFloat.href = `${baseWaUrl}${defaultMsg}`;
  }
}

function renderExperiencias(items) {
  const container = document.getElementById("experiencias-container");
  if (!container) return;

  const activas = items.filter(it => it.Estado && it.Estado.toString().toLowerCase() !== "oculto");
  if (activas.length === 0) {
    container.innerHTML = `<p class="empty-notice">Próximamente publicaremos nuevas fechas de retiros.</p>`;
    return;
  }

  container.innerHTML = activas.map(exp => {
    const numWhatsApp = siteConfig.whatsapp_numero || "573158272120";
    const msg = encodeURIComponent(`¡Hola! Deseo reservar un cupo para el retiro "${exp.Nombre_Retiro}" del ${exp.Fecha}.`);
    const waLink = `https://wa.me/${numWhatsApp}?text=${msg}`;

    return `
      <article class="card card-experiencia">
        ${exp.URL_Imagen ? `<img src="${exp.URL_Imagen}" alt="${exp.Nombre_Retiro}" class="card-img" loading="lazy">` : ''}
        <div class="card-body">
          <span class="badge ${exp.Estado.toLowerCase() === 'abierta' ? 'badge-success' : 'badge-warning'}">${exp.Estado}</span>
          <h3>${exp.Nombre_Retiro}</h3>
          <p class="meta">📅 ${exp.Fecha || ''} | ⏰ ${exp.Horario || ''}</p>
          <p class="desc">${exp.Descripcion_Inclusiones || ''}</p>
          <div class="card-footer">
            <span class="price">${exp.Valor_Persona ? `$${Number(exp.Valor_Persona).toLocaleString('es-CO')}` : 'Consultar'}</span>
            <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-primary">Reservar Cupo</a>
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
    container.innerHTML = `<p class="empty-notice">Servicios en actualización.</p>`;
    return;
  }

  container.innerHTML = visibles.map(srv => {
    const numWhatsApp = siteConfig.whatsapp_numero || "573158272120";
    const msg = encodeURIComponent(`¡Hola! Quisiera agendar una cita para el servicio de "${srv.Nombre_Servicio}".`);
    const waLink = `https://wa.me/${numWhatsApp}?text=${msg}`;

    return `
      <div class="card card-servicio">
        <div class="card-body">
          <span class="badge badge-outline">${srv.Modalidad || 'Individual'}</span>
          <h3>${srv.Nombre_Servicio}</h3>
          <p class="desc">${srv.Enfoque || ''}</p>
          <p class="meta">⏱ Duración: ${srv.Duracion || '1 hora'}</p>
          <div class="card-footer">
            <span class="price">${srv.Valor_Base ? `$${Number(srv.Valor_Base).toLocaleString('es-CO')}` : 'A convenir'}</span>
            <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-secondary">Agendar</a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderProductos(items) {
  const container = document.getElementById("productos-container");
  if (!container) return;

  const disponibles = items.filter(it => it.Disponibilidad && it.Disponibilidad.toString().toLowerCase() !== "oculto");
  if (disponibles.length === 0) {
    container.innerHTML = `<p class="empty-notice">Catálogo botánico en preparación.</p>`;
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

function renderGaleria(items) {
  const container = document.getElementById("galeria-container");
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = ``;
    return;
  }

  container.innerHTML = items.map(media => {
    if (media.Tipo && media.Tipo.toLowerCase() === 'video') {
      return `
        <div class="media-item video-box">
          <iframe src="${media.URL_Recurso}" title="${media.Titulo || ''}" frameborder="0" allowfullscreen loading="lazy"></iframe>
        </div>
      `;
    }
    return `
      <div class="media-item img-box">
        <img src="${media.URL_Recurso}" alt="${media.Titulo || ''}" loading="lazy">
      </div>
    `;
  }).join("");
}
