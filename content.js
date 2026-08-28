chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_data") {
    processPage(request.limit).then((results) => sendResponse(results));
    return true; // Keeps the message channel open for async response
  }
});

async function processPage(limit) {
  const imgs = document.querySelectorAll("img");
  const colorMapImages = {};
  const validUrls = [];

  // Extract valid image sources
  imgs.forEach((img) => {
    if (img.width > 200 && img.height > 200) {
      validUrls.push(img.src);
    }
  });

  const uniqueUrls = [...new Set(validUrls)];
  const colorPromises = uniqueUrls.map((url) =>
    extractColorsAsync(url, colorMapImages),
  );
  await Promise.all(colorPromises);

  // Sort image palette by frequency
  const sortedImageColors = Object.keys(colorMapImages).sort(
    (a, b) => colorMapImages[b] - colorMapImages[a],
  );

  const sitePalette = extractSiteUIColors(limit);

  return {
    images: uniqueUrls,
    imagePalette: sortedImageColors.slice(0, limit),
    sitePalette: sitePalette,
  };
}

// Scans computed CSS styles to build the site's structural UI palette
function extractSiteUIColors(limit) {
  const elements = document.querySelectorAll("*");
  const siteColorMap = {};

  const processCssColor = (colorStr) => {
    if (
      !colorStr ||
      colorStr === "transparent" ||
      colorStr.startsWith("rgba(0, 0, 0, 0)")
    )
      return;

    const rgba = colorStr.match(/\d+(\.\d+)?/g);
    if (rgba && rgba.length >= 3) {
      if (rgba[3] === "0") return; // Ignore fully transparent elements
      const hex = rgbToHex(
        parseInt(rgba[0]),
        parseInt(rgba[1]),
        parseInt(rgba[2]),
      );
      siteColorMap[hex] = (siteColorMap[hex] || 0) + 1;
    }
  };

  elements.forEach((el) => {
    const style = window.getComputedStyle(el);
    processCssColor(style.backgroundColor);
    processCssColor(style.color);
  });

  return Object.keys(siteColorMap)
    .sort((a, b) => siteColorMap[b] - siteColorMap[a])
    .slice(0, limit);
}

// Extracts dominant colors from images using Canvas API
function extractColorsAsync(src, colorMap) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = Math.round(imgData[i] / 20) * 20;
          const g = Math.round(imgData[i + 1] / 20) * 20;
          const b = Math.round(imgData[i + 2] / 20) * 20;
          const a = imgData[i + 3];

          if (a >= 250) {
            const hex = rgbToHex(r, g, b);
            if (hex !== "#ffffff" && hex !== "#000000") {
              colorMap[hex] = (colorMap[hex] || 0) + 1;
            }
          }
        }
        resolve();
      } catch (e) {
        resolve();
      }
    };

    img.onerror = () => resolve();
    img.src = src;
  });
}

function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.min(255, Math.max(0, c)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + toHex(r) + toHex(g) + toHex(b);
}
