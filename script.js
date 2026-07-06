const config = window.MINI_APP_CONFIG || {};
const $ = (id) => document.getElementById(id);

let currentIndex = 0;
let started = false;
let isMusicPlaying = false;

const photos = Array.isArray(config.fotos) ? config.fotos : [];
const messages = Array.isArray(config.mensajes) ? config.mensajes : [];
const extraQuotes = Array.isArray(config.frasesExtra) ? config.frasesExtra : [];
const poemLines = Array.isArray(config.poema) ? config.poema : [];

const featuredIndexes = Array.isArray(config.indicesDestacados)
  ? config.indicesDestacados
  : [0, 1, 2, 3, 4];

const postcardIndexes = Array.isArray(config.indicesPostales)
  ? config.indicesPostales
  : [5, 6, 7, 8];

function pickPhotosByIndex(list, indexes, fallback = []) {
  const picked = indexes.map((i) => list[i]).filter(Boolean);
  return picked.length ? picked : fallback;
}

const featuredPhotos = pickPhotosByIndex(photos, featuredIndexes, photos.slice(0, 5));
const postcardPhotos = pickPhotosByIndex(photos, postcardIndexes, photos.slice(5, 9));

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"];
const audioFallbacks = [
  config.rutaMusica,
  "assets/musica/cancion.mp3",
  "assets/musica/cancion.mp3.mp3",
  "assets/musica/cancion.m4a",
  "assets/musica/cancion.wav",
  "assets/musica/audio.mp3"
].filter(Boolean);

function setText(id, text) {
  const el = $(id);
  if (el && text) el.textContent = text;
}

function setMultilineText(id, text) {
  const el = $(id);
  if (!el || !text) return;
  el.innerHTML = String(text).split("\n").map((line, index) => {
    const safe = escapeHtml(line);
    return index === 0 ? `<strong>${safe}</strong>` : safe;
  }).join("<br />");
}

function applyConfig() {
  document.documentElement.style.setProperty("--principal", config.colores?.principal || "#ff6b9d");
  document.documentElement.style.setProperty("--secundario", config.colores?.secundario || "#ffb86b");
  document.documentElement.style.setProperty("--acento", config.colores?.acento || "#8b5cf6");
  document.documentElement.style.setProperty("--fondo", config.colores?.fondo || "#fff7fb");
  document.documentElement.style.setProperty("--azulFilmarte", config.colores?.azulFilmarte || "#1d9bd7");

  document.title = config.producto || "Mini App Dulzura";

  setText("welcomeEyebrow", config.producto);
  setText("welcomeTitle", config.tituloBienvenida);
  setText("welcomeSubtitle", config.subtituloBienvenida);
  setText("namesTitle", config.nombreDestinatario);
  setText("heroKicker", config.heroKicker);
  setText("heroTitle", config.heroTitle || config.nombreDestinatario);
  setText("heroPhrase", config.heroPhrase);
  setText("brandPhrase", config.brandPhrase);
  setMultilineText("brandFooter", config.footerMarca);

  const music = $("bgMusic");
  if (music && audioFallbacks.length) music.src = audioFallbacks[0];

  const firstPhoto = photos[0];
  if (firstPhoto) {
    setImageWithFallback($("heroPhoto"), $("heroFallback"), firstPhoto.src, "Subí tu foto principal como foto-01.jpg");
  }

  renderPhoto();
  renderMemoryStrip();
  renderPoem();
  renderQuotes();
  renderGallery();
  renderMessages();
  setupWhatsapp();
  createFloatingHearts();
}

function buildImageCandidates(src) {
  if (!src) return [];

  const dotIndex = src.lastIndexOf(".");
  const slashIndex = src.lastIndexOf("/");
  const hasExtension = dotIndex > slashIndex;

  if (!hasExtension) return imageExtensions.map((ext) => src + ext);

  const base = src.slice(0, dotIndex);
  return [src, ...imageExtensions.map((ext) => base + ext), src + ".jpg", src + ".png"]
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

function setImageWithFallback(img, fallback, src, fallbackText) {
  if (!img) return;
  const candidates = buildImageCandidates(src);
  let attempt = 0;

  img.classList.remove("hidden");
  if (fallback) fallback.classList.add("hidden");

  const tryNext = () => {
    if (attempt >= candidates.length) {
      img.classList.add("hidden");
      if (fallback) {
        fallback.classList.remove("hidden");
        fallback.textContent = fallbackText || `Falta ${src}`;
      }
      return;
    }
    img.src = candidates[attempt];
    attempt += 1;
  };

  img.onerror = tryNext;
  tryNext();
}

function setImageWithFallbackForCreatedImage(img, src, parent, fallbackText) {
  const candidates = buildImageCandidates(src);
  let attempt = 0;

  const tryNext = () => {
    if (attempt >= candidates.length) {
      img.remove();
      const fallback = document.createElement("div");
      fallback.className = "photo-fallback";
      fallback.textContent = fallbackText;
      parent.appendChild(fallback);
      return;
    }
    img.src = candidates[attempt];
    attempt += 1;
  };

  img.onerror = tryNext;
  tryNext();
}

function renderPhoto() {
  const photo = featuredPhotos[currentIndex];
  if (!photo) return;

  setImageWithFallback(
    $("currentPhoto"),
    $("currentPhotoFallback"),
    photo.src,
    `Falta ${photo.src}`
  );

  setText("photoCounter", `${currentIndex + 1} / ${featuredPhotos.length}`);
  setText("photoTitle", photo.titulo || "Un recuerdo lindo");
  setText("photoPhrase", photo.frase || "Hay momentos que merecen guardarse.");
}

function renderMemoryStrip() {
  const strip = $("memoryStrip");
  if (!strip) return;
  strip.innerHTML = "";

  postcardPhotos.forEach((photo, index) => {
    const card = document.createElement("article");
    card.className = "memory-card";

    const img = document.createElement("img");
    img.alt = photo.titulo || `Postal ${index + 1}`;
    setImageWithFallbackForCreatedImage(img, photo.src, card, `Falta postal ${index + 1}`);

    const p = document.createElement("p");
    p.textContent = photo.frase || "Un momento para guardar.";

    card.appendChild(img);
    card.appendChild(p);
    strip.appendChild(card);
  });
}

function renderPoem() {
  const container = $("poemText");
  if (!container) return;

  container.innerHTML = poemLines.map((line) => {
    if (!line) return `<div class="empty-line"></div>`;
    return `<p>${escapeHtml(line)}</p>`;
  }).join("");
}

function renderQuotes() {
  const grid = $("quotesGrid");
  if (!grid) return;

  grid.innerHTML = extraQuotes.map((quote) => `
    <article class="quote-card">
      <span class="quote-mark">“</span>
      <p>${escapeHtml(quote)}</p>
    </article>
  `).join("");
}

function renderGallery() {
  const grid = $("galleryGrid");
  if (!grid) return;
  grid.innerHTML = "";

  photos.forEach((photo, index) => {
    const btn = document.createElement("button");
    btn.className = "gallery-item";
    btn.type = "button";

    const img = document.createElement("img");
    img.alt = photo.titulo || `Foto ${index + 1}`;
    setImageWithFallbackForCreatedImage(img, photo.src, btn, `Falta foto-${String(index + 1).padStart(2, "0")}`);

    const caption = document.createElement("span");
    caption.className = "gallery-caption";
    caption.textContent = photo.titulo || `Foto ${index + 1}`;

    btn.appendChild(img);
    btn.appendChild(caption);
    btn.addEventListener("click", () => openLightbox(photo));
    grid.appendChild(btn);
  });
}

function renderMessages() {
  const grid = $("messagesGrid");
  if (!grid) return;
  grid.innerHTML = messages.map((message) => `<article class="message-card">${escapeHtml(message)}</article>`).join("");
}

function setupWhatsapp() {
  const btn = $("whatsappBtn");
  if (!btn) return;

  if (config.mostrarBotonWhatsapp && config.numeroWhatsapp) {
    const text = encodeURIComponent(config.textoWhatsapp || "Me encantó la mini app 💞");
    btn.href = `https://wa.me/${config.numeroWhatsapp}?text=${text}`;
    btn.classList.remove("hidden");
  }
}

function openLightbox(photo) {
  const img = $("lightboxImg");
  setImageWithFallback(img, null, photo.src, "");
  $("lightboxCaption").textContent = photo.frase || photo.titulo || "";
  $("lightbox").classList.remove("hidden");
}

function closeLightbox() {
  $("lightbox").classList.add("hidden");
  $("lightboxImg").src = "";
}

async function startExperience() {
  if (started) return;
  started = true;
  $("welcome").classList.remove("active");
  $("welcome").classList.add("hidden");
  $("experience").classList.remove("hidden");
  await playMusic();
}

async function playMusic() {
  const music = $("bgMusic");
  if (!music || !audioFallbacks.length) return;
  let attempt = 0;

  async function tryAudio() {
    if (attempt >= audioFallbacks.length) {
      isMusicPlaying = false;
      $("musicBtn").textContent = "♪";
      showToast("No pude encontrar o reproducir la canción. Revisá el nombre real del archivo.");
      return;
    }

    music.src = audioFallbacks[attempt];
    attempt += 1;

    try {
      await music.play();
      isMusicPlaying = true;
      $("musicBtn").textContent = "❚❚";
    } catch (error) {
      tryAudio();
    }
  }

  await tryAudio();
}

function toggleMusic() {
  const music = $("bgMusic");
  if (!music || !audioFallbacks.length) return;

  if (isMusicPlaying) {
    music.pause();
    isMusicPlaying = false;
    $("musicBtn").textContent = "♪";
  } else {
    playMusic();
  }
}

function showSurprise() {
  const box = $("surpriseMessage");
  box.textContent = config.mensajeFinal || "Una sorpresa hecha especialmente para vos.";
  box.classList.remove("hidden");
  burstHearts();
}

function burstHearts() {
  const symbols = ["💞", "✨", "💗", "🎁", "🌟", "💖", "💙"];
  for (let i = 0; i < 34; i++) {
    const span = document.createElement("span");
    span.className = "burst-heart";
    span.textContent = symbols[i % symbols.length];
    span.style.setProperty("--x", `${(Math.random() - 0.5) * 620}px`);
    span.style.setProperty("--y", `${(Math.random() - 0.5) * 620}px`);
    span.style.fontSize = `${20 + Math.random() * 24}px`;
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 1300);
  }
}

function createFloatingHearts() {
  const wrap = document.querySelector(".floating-hearts");
  if (!wrap) return;

  for (let i = 0; i < 28; i++) {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = ["♡", "♥", "✦", "✧", "💙"][i % 5];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.animationDelay = `${Math.random() * 8}s`;
    heart.style.fontSize = `${22 + Math.random() * 34}px`;
    wrap.appendChild(heart);
  }
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 4200);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

$("startBtn").addEventListener("click", startExperience);
$("musicBtn").addEventListener("click", toggleMusic);

$("prevBtn").addEventListener("click", () => {
  if (!featuredPhotos.length) return;
  currentIndex = (currentIndex - 1 + featuredPhotos.length) % featuredPhotos.length;
  renderPhoto();
});

$("nextBtn").addEventListener("click", () => {
  if (!featuredPhotos.length) return;
  currentIndex = (currentIndex + 1) % featuredPhotos.length;
  renderPhoto();
});

$("surpriseBtn").addEventListener("click", showSurprise);
$("closeLightbox").addEventListener("click", closeLightbox);
$("lightbox").addEventListener("click", (event) => {
  if (event.target.id === "lightbox") closeLightbox();
});

applyConfig();
