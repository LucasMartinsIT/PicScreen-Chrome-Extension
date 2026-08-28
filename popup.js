let allImages = [];
let currentPage = 1;
const itemsPerPage = 26;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize i18n localization
  document.getElementById("btn-extract").innerText =
    chrome.i18n.getMessage("btnAnalyze") || "Analisar Página";
  document.getElementById("btn-download").innerText =
    chrome.i18n.getMessage("btnDownload") || "Baixar Tudo em .ZIP";
  document.getElementById("label-colors").innerText =
    chrome.i18n.getMessage("labelColors") || "Cores";
  document.getElementById("title-site-palette").innerText =
    chrome.i18n.getMessage("titleSitePalette") || "Paleta do Site (Design)";
  document.getElementById("title-image-palette").innerText =
    chrome.i18n.getMessage("titleImagePalette") || "Paleta das Imagens (Arte)";
  document.getElementById("title-eyedropper").innerText =
    chrome.i18n.getMessage("titleEyedropper") || "Conta-gotas (Cor Específica)";
  document.getElementById("btn-eyedropper").innerText =
    chrome.i18n.getMessage("btnEyedropper") || "Pegar cor";

  const footerText =
    chrome.i18n.getMessage("footerText") || "☕ Poupou seu tempo? ";
  const footerLink =
    chrome.i18n.getMessage("footerLink") || "Pague-me um café!";
  document.getElementById("footer-content").innerHTML =
    `${footerText} <a href="https://ko-fi.com/lucasmartins1991" target="_blank">${footerLink}</a>`;

  // UI Panels toggle handlers
  const toggleSite = document.getElementById("toggle-site-palette");
  const siteContainer = document.getElementById("site-palette-container");
  toggleSite.addEventListener("click", () => {
    siteContainer.classList.toggle("collapsed");
    toggleSite.querySelector(".arrow").innerText =
      siteContainer.classList.contains("collapsed") ? "►" : "▼";
  });

  const toggleImage = document.getElementById("toggle-image-palette");
  const imageContainer = document.getElementById("image-palette-container");
  toggleImage.addEventListener("click", () => {
    imageContainer.classList.toggle("collapsed");
    toggleImage.querySelector(".arrow").innerText =
      imageContainer.classList.contains("collapsed") ? "►" : "▼";
  });
});

// Main page analysis trigger
document.getElementById("btn-extract").addEventListener("click", async () => {
  const btn = document.getElementById("btn-extract");
  const limitInput = parseInt(document.getElementById("palette-limit").value);
  const maxColors = limitInput > 0 ? limitInput : 10;

  btn.innerText =
    chrome.i18n.getMessage("msgAnalyzing") || "Analisando... aguarde";
  btn.disabled = true;

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(
    tab.id,
    { action: "extract_data", limit: maxColors },
    (response) => {
      btn.innerText = chrome.i18n.getMessage("btnAnalyze") || "Analisar Página";
      btn.disabled = false;

      if (!response) return;

      renderizarCores("site-palette-container", response.sitePalette);
      renderizarCores("image-palette-container", response.imagePalette);

      allImages = response.images;
      currentPage = 1;
      renderGallery();

      document.getElementById("btn-download").style.display = "block";
    },
  );
});

// Render hex color blocks with clipboard copy support
function renderizarCores(containerId, arrayDeCores) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  arrayDeCores.forEach((hex) => {
    let colorBox = document.createElement("div");
    colorBox.className = "color-box";
    colorBox.style.backgroundColor = hex;
    colorBox.innerHTML = `<span>${hex}</span>`;

    if (hex === "#ffffff") colorBox.querySelector("span").style.color = "#000";

    colorBox.addEventListener("click", () => {
      navigator.clipboard.writeText(hex);
      colorBox.querySelector("span").innerText =
        chrome.i18n.getMessage("msgCopied") || "Copiado!";
      setTimeout(() => (colorBox.querySelector("span").innerText = hex), 1500);
    });
    container.appendChild(colorBox);
  });
}

// Render image references with layout stability pre-loading and DocumentFragment
async function renderGallery() {
  const gallery = document.getElementById("gallery");
  const loadingText =
    chrome.i18n.getMessage("msgLoading") || "Carregando referências... ⌛";
  gallery.innerHTML = `<div style='grid-column: 1 / -1; text-align: center; color: #888; padding: 20px 0;'>${loadingText}</div>`;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const imagesToShow = allImages.slice(startIndex, endIndex);

  // Pre-load images to ensure accurate popup height calculation
  await Promise.all(
    imagesToShow.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
      });
    }),
  );

  gallery.innerHTML = "";

  const fragment = document.createDocumentFragment();

  imagesToShow.forEach((src) => {
    let wrapper = document.createElement("div");
    wrapper.className = "img-container";

    let imgElement = document.createElement("img");
    imgElement.src = src;

    let btnDown = document.createElement("button");
    btnDown.className = "btn-single-down";
    btnDown.innerHTML = "📥";
    btnDown.title =
      chrome.i18n.getMessage("msgDownloadSingle") || "Baixar esta imagem";

    // Individual image download handling via blob fetch
    btnDown.addEventListener("click", async () => {
      btnDown.innerHTML = "⌛";
      try {
        const response = await fetch(src);
        const blob = await response.blob();

        const urlParts = src.split("/");
        let filename = urlParts[urlParts.length - 1].split("?")[0];
        if (!filename.includes(".")) filename = `ref_unica_${Date.now()}.jpg`;

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        btnDown.innerHTML = "✔️";
        setTimeout(() => (btnDown.innerHTML = "📥"), 1500);
      } catch (e) {
        btnDown.innerHTML = "❌";
        console.warn("Falha ao baixar imagem única:", src);
      }
    });

    wrapper.appendChild(imgElement);
    wrapper.appendChild(btnDown);

    fragment.appendChild(wrapper);
  });

  gallery.appendChild(fragment);

  updatePaginationControls();
}

function updatePaginationControls() {
  const controls = document.getElementById("pagination-controls");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const pageInfo = document.getElementById("page-info");

  if (allImages.length > itemsPerPage) {
    controls.style.display = "flex";
    const totalPages = Math.ceil(allImages.length / itemsPerPage);
    pageInfo.innerText = `${currentPage}/${totalPages}`;
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = currentPage === totalPages;
  } else {
    controls.style.display = "none";
  }
}

document.getElementById("btn-prev").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderGallery();
  }
});

document.getElementById("btn-next").addEventListener("click", () => {
  const totalPages = Math.ceil(allImages.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderGallery();
  }
});

// Batch download handler using JSZip
document.getElementById("btn-download").addEventListener("click", async () => {
  const btnDownload = document.getElementById("btn-download");
  btnDownload.innerText =
    chrome.i18n.getMessage("msgPackaging") || "Empacotando... aguarde";
  btnDownload.disabled = true;

  const zip = new JSZip();
  const imgFolder = zip.folder("referencias_visuais");

  for (let i = 0; i < allImages.length; i++) {
    try {
      const response = await fetch(allImages[i]);
      const blob = await response.blob();
      const urlParts = allImages[i].split("/");
      let filename = urlParts[urlParts.length - 1].split("?")[0];
      if (!filename.includes(".")) filename = `ref_${i}.jpg`;
      imgFolder.file(filename, blob);
    } catch (e) {
      console.warn("Falha ao incluir imagem no ZIP:", allImages[i]);
    }
  }

  zip.generateAsync({ type: "blob" }).then(function (content) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "moodboard_referencias.zip";
    link.click();
    btnDownload.innerText =
      chrome.i18n.getMessage("btnDownload") || "Baixar Tudo em .ZIP";
    btnDownload.disabled = false;
  });
});

// Native EyeDropper API implementation
document
  .getElementById("btn-eyedropper")
  .addEventListener("click", async () => {
    if (!window.EyeDropper) {
      alert(
        chrome.i18n.getMessage("msgNoEyedropper") ||
          "Seu navegador não suporta a ferramenta de Conta-gotas nativa.",
      );
      return;
    }

    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const hex = result.sRGBHex;

      const resultBox = document.getElementById("eyedropper-result");
      resultBox.style.backgroundColor = hex;
      resultBox.style.border = "none";

      const span = resultBox.querySelector("span");
      span.innerText = hex;
      span.style.color = hex.toLowerCase() === "#ffffff" ? "#000" : "#fff";

      resultBox.onclick = () => {
        const emptyText = chrome.i18n.getMessage("msgEmpty") || "Vazio";
        if (span.innerText !== emptyText && span.innerText !== "Empty") {
          navigator.clipboard.writeText(hex);
          span.innerText = chrome.i18n.getMessage("msgCopied") || "Copiado!";
          setTimeout(() => (span.innerText = hex), 1500);
        }
      };
    } catch (e) {
      console.log("Seleção de cor cancelada.");
    }
  });
