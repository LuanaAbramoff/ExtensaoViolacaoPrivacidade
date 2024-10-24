let thirdPartyConnections = {};

// Função para extrair o domínio de uma URL
function getDomain(url) {
  let anchor = document.createElement("a");
  anchor.href = url;
  return anchor.hostname;
}

// Escuta as solicitações de rede
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    let tabId = details.tabId;
    let requestUrl = details.url;

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
});

// Função para obter as conexões de terceiros para uma aba específica
function getThirdPartyConnections(tabId) {
  return thirdPartyConnections[tabId] ? Array.from(thirdPartyConnections[tabId]) : [];
}

// Fornece os dados para o popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getConnections" && sender.tab) {
    sendResponse(getThirdPartyConnections(sender.tab.id));
  }
});
