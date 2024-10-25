let thirdPartyConnections = {};
let noSafeCookies = {};
let postRequestCounts = {};
let storageUsage = {};
let cookiesInfo = {};
let canvasFingerprintingAlerts = {};
let contagem_alerta_canvas = {};
let contagem_hooking_hijacking = {};

// Função para extrair o domínio de uma URL
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}


// Função para calcular a pontuação do site
function calculateScore(tabId) {
  let score = 100; // Pontuação inicial

  console.log("CONTAGEM DE POST:", postRequestCounts[tabId]);
  console.log("CONTAGEM HOOK E HICKJACKING:",contagem_hooking_hijacking[tabId]);
  console.log("CONTAGEM CANVAS FINGER PRINT:", contagem_alerta_canvas[tabId]);

  // Verificar cookies de terceira parte
  const totalThirdPartyCookies = (cookiesInfo[tabId]?.thirdPartyCookies.session || 0) + (cookiesInfo[tabId]?.thirdPartyCookies.persistent || 0);
  if (totalThirdPartyCookies > 5) {
    score -= totalThirdPartyCookies * 3;
  }

  // Verificar requisições POST
  if (postRequestCounts[tabId] > 90) {
    score -= 10;
  }

  // Verificar alertas de hijacking
  if (contagem_hooking_hijacking[tabId] > 10) {
    score -= 10;
  }

  // Verificar risco de canvas fingerprinting
  if (contagem_alerta_canvas[tabId] > 0) {
    score -= 4;
  }

  if(noSafeCookies[tabId] > 30){
    score -= 2*noSafeCookies[tabId]*0.1;
  }  

  return Math.max(score, 0); // Garantir que a pontuação não fique negativa
}



// Verificação de armazenamento local
function checkLocalStorage(tabId) {
  const code = `
    (() => {
      return localStorage.length;
    })();
  `;
  browser.tabs.executeScript(tabId, { code }).then((results) => {
    const storageSize = results[0];

    if (!storageUsage[tabId]) {
      storageUsage[tabId] = new Set();
    }

    if (storageSize > 0) {
      storageUsage[tabId].add(`Uso de Local Storage: (${storageSize})`);
    }
  }).catch((error) => console.error('Erro ao verificar localStorage:', error));
}

// Verificação de fingerprinting via Canvas
function checkCanvasFingerprinting(tabId) {
  const code = `
    (() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillText('test', 50, 50);
      return canvas.toDataURL() ? true : false;
    })();
  `;
  browser.tabs.executeScript(tabId, { code }).then((results) => {
    const isFingerprinting = results[0];
    if (!canvasFingerprintingAlerts[tabId]) {
      canvasFingerprintingAlerts[tabId] = new Set();
    }
    if (!contagem_alerta_canvas[tabId]) {
      contagem_alerta_canvas[tabId] = 0;
    }
    if (isFingerprinting) {
      contagem_alerta_canvas[tabId]++;
      canvasFingerprintingAlerts[tabId].add("Possível Canvas Fingerprint Detectado!");
      console.log("Possível Canvas Fingerprint detectado.");
    }
  }).catch((error) => console.error('Erro ao verificar Canvas Fingerprinting:', error));
}

// Verificação de Hooking
function checkFunctionHooking(tabId) {
  const code = `
    (() => {
      const originalFetch = window.fetch;
      const originalOnload = window.onload;
      const fetchHooked = window.fetch !== originalFetch;
      const loadHooked = window.onload !== originalOnload;

      let hookedEvents = [];
      document.querySelectorAll('*').forEach((element) => {
        if (element.onclick || element.onsubmit) {
          hookedEvents.push(element);
        }
      });

      return {
        fetchHooked,
        loadHooked,
        hookedEventsTotal: hookedEvents.length > 0
      };
    })();
  `;

  browser.tabs.executeScript(tabId, { code }).then((results) => {
    const { fetchHooked, loadHooked, hookedEventsTotal } = results[0];

    if (!contagem_hooking_hijacking[tabId]) {
      contagem_hooking_hijacking[tabId] = 0;
    }

    if (fetchHooked) {
      console.log("Possível Hooking detectado: a função 'fetch' foi modificada.");
      contagem_hooking_hijacking[tabId]++;
    }
    if (loadHooked) {
      console.log("Possível Hooking detectado: a função 'onload' foi modificada.");
      contagem_hooking_hijacking[tabId]++;
    }
    if (hookedEventsTotal) {
      console.log("Possível Hooking detectado: elementos com eventos de terceiros.");
      contagem_hooking_hijacking[tabId]++;
    }
  }).catch((error) => console.error('Erro ao verificar Hooking:', error));
}

// Verificação de Hijacking
function checkFunctionHijacking(tabId) {
  const code = `
    (() => {
      const scripts = Array.from(document.scripts);
      const thirdPartyScripts = scripts.filter(script => {
        const scriptSrc = script.src;
        if (!scriptSrc) {
          return false;
        }
        const pageDomain = new URL(document.location).hostname;
        const scriptDomain = new URL(scriptSrc).hostname;
        return scriptDomain !== pageDomain;
      });

      return thirdPartyScripts.map(script => script.src);
    })();
  `;

  browser.tabs.executeScript(tabId, { code }).then((results) => {
    const thirdPartyScripts = results[0];

    if (!contagem_hooking_hijacking[tabId]) {
      contagem_hooking_hijacking[tabId] = 0;
    }

    if (thirdPartyScripts.length > 0) {
      contagem_hooking_hijacking[tabId] = contagem_hooking_hijacking[tabId] + thirdPartyScripts.length/2;
      console.log(`Possível Hijacking detectado: scripts de terceiros - ${thirdPartyScripts.join(', ')}`);
    }
  }).catch((error) => console.error('Erro ao verificar Hijacking:', error));
}

// Função para verificar e atualizar cookies
async function updateCookies(tabId, url) {
  try {
    const allCookies = await browser.cookies.getAll({ url });
    let firstPartyCookies = { session: 0, persistent: 0 };
    let thirdPartyCookies = { session: 0, persistent: 0 };

    allCookies.forEach((cookie) => {
      console.log(cookie);
      const isFirstParty = new URL(url).hostname.includes(cookie.domain);
      const isSession = !cookie.expirationDate;
      const isSafe = cookie.secure;

      if (!noSafeCookies[tabId]) {
        noSafeCookies[tabId] = 0;
      }

      if(!isSafe){
        noSafeCookies[tabId]++;
      }

      if (isFirstParty) {
        isSession ? firstPartyCookies.session++ : firstPartyCookies.persistent++;
      } else {
        isSession ? thirdPartyCookies.session++ : thirdPartyCookies.persistent++;
      }
    });
    
    cookiesInfo[tabId] = { firstPartyCookies, thirdPartyCookies, totalCookies: allCookies.length };

    if (thirdPartyCookies.session + thirdPartyCookies.persistent >= 5) {
      console.log("Muitos cookies de terceira parte detectados, pode haver rastreamento.");
    }
  } catch (error) {
    console.error("Erro ao obter cookies:", error);
  }
}

// Monitoramento de navegação
browser.webNavigation.onCompleted.addListener((details) => {
  const { tabId, url } = details;
  updateCookies(tabId, url);
  checkLocalStorage(tabId);
  checkCanvasFingerprinting(tabId);
  checkFunctionHijacking(tabId);
  checkFunctionHooking(tabId);
});

// Escuta as requisições de rede
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { tabId, method, url } = details;

    if (method === "POST") {
      postRequestCounts[tabId] = (postRequestCounts[tabId] || 0) + 1;
      setTimeout(() => postRequestCounts[tabId]--, 10000);
    }

    browser.tabs.get(tabId).then((tab) => {
      if (tab && tab.url) {
        const mainDomain = getDomain(tab.url);
        const requestDomain = getDomain(url);

        if (mainDomain !== requestDomain) {
          thirdPartyConnections[tabId] = thirdPartyConnections[tabId] || new Set();
          thirdPartyConnections[tabId].add(requestDomain);
        }
      }
    });
  },
  { urls: ["<all_urls>"] }
);

// Limpa dados ao fechar uma aba
browser.tabs.onRemoved.addListener((tabId) => {
  delete thirdPartyConnections[tabId];
  delete postRequestCounts[tabId];
  delete storageUsage[tabId];
  delete cookiesInfo[tabId];
  delete contagem_alerta_canvas[tabId];
  delete contagem_hooking_hijacking[tabId];
  delete noSafeCookies[tabId];
  delete canvasFingerprintingAlerts[tabId];
});

// Responde ao popup.js com os dados coletados
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getConnections") {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs[0];

      if (tab) {
        const response = {
          thirdPartyConnections: Array.from(thirdPartyConnections[tab.id] || []),
          score: calculateScore(tab.id), // Retorna a pontuação calculada
          storageUsage: Array.from(storageUsage[tab.id] || []),
          cookiesInfo: cookiesInfo[tab.id] || {},
          canvasFingerprintingAlerts: Array.from(canvasFingerprintingAlerts[tab.id] || [])
        };
        sendResponse(response);
      }
    });
    return true;
  }
});

        
