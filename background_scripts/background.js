let thirdPartyConnections = {};
let potentialThreats = {};
let openPorts = {};
let postRequestCounts = {};
let storageUsage = {};
let cookiesInfo = {};
let canvasFingerprintingAlerts = {};

// Função para extrair o domínio de uma URL
function getDomain(url) {
  let anchor = document.createElement("a");
  anchor.href = url;
  return anchor.hostname;
}

function getPort(url) {
  let anchor = document.createElement("a");
  anchor.href = url;
  return anchor.port || (anchor.protocol === "http:" ? "80" : anchor.protocol === "https:" ? "443" : "");
}

function checkPostFlooding(tabId) {
  if (postRequestCounts[tabId] > 5) { // Limite arbitrário, ajuste conforme necessário
    if (!potentialThreats[tabId]) {
      potentialThreats[tabId] = new Set();
    }
    potentialThreats[tabId].add(`Múltiplas requisições POST (${postRequestCounts[tabId]} vezes) em um curto período.`);
  }
}

async function updateCookies(tabId, url){
  try{
    const allCookies = await browser.cookies.getAll({ url });

    let firstPartyCookies = { session: 0, persistent: 0 };
    let thirdPartyCookies = { session: 0, persistent: 0 };

    allCookies.forEach(cookie => {

      const isFirstParty = new URL(url).hostname.includes(cookie.domain);
      const isSessionCookie = !cookie.expirationDate;

      if(isFirstParty){
        if(isSessionCookie){
          firstPartyCookies.session++;
        } else {
          firstPartyCookies.persistent++;
        }
      } else {
        if (isSessionCookie){
          thirdPartyConnections.session++;
        } else {
          thirdPartyConnections.persistent++;
        }
      }
    });

    cookiesInfo[tabId] = {
      firstPartyCookies,
      thirdPartyCookies,
      totalCookies: allCookies.length
    };

    if(!potentialThreats[tabId]){
      potentialThreats[tabId] = new Set();
    }
    if(thirdPartyCookies.session + thirdPartyCookies.persistent >= 5){
      potentialThreats[tabId].add("Muitos cookies de terceira parte detectados, pode haver rastreamento.");
    }
  } catch(error){
    console.error("Erro ao obter cookies:", error);
  }
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "storageUsed" && sender.tab) {
    let tabId = sender.tab.id;
    let storageType = message.storageType;
    let storageKey = message.key;
    let storageValue = message.value;

    if (!storageUsage[tabId]) {
      storageUsage[tabId] = [];
    }
    storageUsage[tabId].push({
      storageType: storageType,
      key: storageKey,
      value: storageValue
    });

    // Adiciona uma ameaça potencial
    if (!potentialThreats[tabId]) {
      potentialThreats[tabId] = new Set();
    }
    potentialThreats[tabId].add(`Uso de ${storageType} detectado: chave "${storageKey}" armazenada.`);
  }
  if (message.action === "canvasFingerprintingDetected" && sender.tab){
    const tabId = sender.tab.id;

    if(!canvasFingerprintingAlerts[tabId]){
      canvasFingerprintingAlerts[tabId] = [];
    }
    canvasFingerprintingAlerts[tabId].push("Tentativa de fingerprinting de canvas detectada.");

    if(!potentialThreats[tabId]){
      potentialThreats[tabId] = new Set();
    }
    potentialThreats[tabId].add("Tentativa de fingerprinting de canvas detectada.");
  }
});

browser.webNavigation.onCompleted.addListener((details) => {
  updateCookies(details.tabId, details.url);
});

// Escuta as solicitações de rede
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    let tabId = details.tabId;
    let method = details.method;
    let requestUrl = details.url;
    let port = getPort(requestUrl);

    if(port && port !== "80" && port !== "443")
    {
      if(!openPorts[tabId]) {
        openPorts[tabId] = new Set();
      }

      openPorts[tabId].add(port);
    }

    if(!potentialThreats[tabId]){
      potentialThreats[tabId] = new Set();
    }
    potentialThreats[tabId].add(`Conexão para porta incomum ${port} detectada em ${getDomain(requestUrl)}.`);

    // Contagem de requisições POST
    if (method === "POST") {
      if (!postRequestCounts[tabId]) {
        postRequestCounts[tabId] = 0;
      }
      postRequestCounts[tabId] += 1;

      // Verifica se o número de requisições POST em um curto período é alto
      setTimeout(() => {
        postRequestCounts[tabId] -= 1; // Reduz a contagem após o intervalo de tempo (por exemplo, 10 segundos)
      }, 10000);

      checkPostFlooding(tabId);
    }

    // Obtém o domínio do pedido e o domínio da aba ativa
    browser.tabs.get(tabId, (tab) => {
      if (tab && tab.url) {
        let mainDomain = getDomain(tab.url);
        let requestDomain = getDomain(requestUrl);

        // Se os domínios forem diferentes, é uma conexão de terceira parte
        if (mainDomain !== requestDomain) {
          if (!thirdPartyConnections[tabId]) {
            thirdPartyConnections[tabId] = new Set();
          }
          thirdPartyConnections[tabId].add(requestDomain);
        }
      }
    });
  },
  { urls: ["<all_urls>"] }
);

// Limpa os dados quando a aba é fechada
browser.tabs.onRemoved.addListener((tabId) => {
  delete thirdPartyConnections[tabId];
  delete openPorts[tabId];
  delete potentialThreats[tabId];
  delete postRequestCounts[tabId];
  delete storageUsage[tabId];
  delete cookiesInfo[tabId];
  delete canvasFingerprintingAlerts[tabId];

});

function getCanvasFingerprintingAlerts(tabId) {
  return canvasFingerprintingAlerts[tabId] ? canvasFingerprintingAlerts[tabId] : [];
}

// Função para obter as conexões de terceiros para uma aba específica
function getThirdPartyConnections(tabId) {
  return thirdPartyConnections[tabId] ? Array.from(thirdPartyConnections[tabId]) : [];
}

function getOpenPorts(tabId) {
  return openPorts[tabId] ? Array.from(openPorts[tabId]) : [];
}

function getPotentialThreats(tabId){
  return potentialThreats[tabId] ? Array.from(potentialThreats[tabId]) : [];
}

// Função para obter o uso de armazenamento para uma aba específica
function getStorageUsage(tabId) {
  return storageUsage[tabId] ? storageUsage[tabId] : [];
}

// Função para obter informações de cookies para uma aba específica
function getCookiesInfo(tabId) {
  return cookiesInfo[tabId] ? cookiesInfo[tabId] : {
    firstPartyCookies: { session: 0, persistent: 0 },
    thirdPartyCookies: { session: 0, persistent: 0 },
    totalCookies: 0
  }
};

// Fornece os dados para o popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getConnections" && sender.tab) {
    sendResponse({thirdPartyConnections: getThirdPartyConnections(sender.tab.id),   
                  openPorts: openPorts(sender.tab.id),
                  potentialThreats: getPotentialThreats(sender.tab.id),
                  storageUsage: getStorageUsage(sender.tab.id),
                  cookiesInfo: getCookiesInfo(sender.tab.id),
                  canvasFingerprintingAlerts: getCanvasFingerprintingAlerts(sender.tab.id)});
  }
});
