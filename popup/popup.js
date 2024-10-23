document.addEventListener("DOMContentLoaded", () => {
    // Solicita as conexões de terceiros do background.js
    browser.runtime.sendMessage({ action: "getConnections" }, (response) => {
      const connectionList = document.getElementById("connection-list");
      const portList = document.getElementById("port-list");
      const threatList = document.getElementById("threat-list");
      const storageList = document.getElementById("storage-list");
      const cookieList = document.getElementById("cookie-list");
      const fingerprintingList = document.getElementById("fingerprinting-list");

      connectionList.innerHTML = "";
      threatList.innerHTML = "";
      portList.innerHTML = "";
      storageList.innerHTML = "";
      cookieList.innerHTML = "";
      fingerprintingList.innerHTML = "";
  
      if (response && response.length > 0) {
        response.forEach((domain) => {
          let listItem = document.createElement("li");
          listItem.textContent = domain;
          connectionList.appendChild(listItem);
        });
      } else {
        let listItem = document.createElement("li");
        listItem.textContent = "Nenhuma conexão de terceiro detectada.";
        connectionList.appendChild(listItem);
      }

      if (response && response.potentialThreats.length > 0) {
        response.potentialThreats.forEach((threat) => {
          let listItem = document.createElement("li");
          listItem.textContent = threat;
          threatList.appendChild(listItem);
        });
      } else {
        let listItem = document.createElement("li");
        listItem.textContent = "Nenhuma ameaça detectada.";
        threatList.appendChild(listItem);
      }

      if (response && response.openPorts.length > 0) {
        response.openPorts.forEach((port) => {
          let listItem = document.createElement("li");
          listItem.textContent = `Porta aberta: ${port}`;
          portList.appendChild(listItem);
        });
      } else {
        let listItem = document.createElement("li");
        listItem.textContent = "Nenhuma porta incomum detectada.";
        portList.appendChild(listItem);
      }

      if (response && response.storageUsage.length > 0) {
        response.storageUsage.forEach((storage) => {
          let listItem = document.createElement("li");
          listItem.textContent = `${storage.storageType}: Chave "${storage.key}" armazenada com valor "${storage.value}"`;
          storageList.appendChild(listItem);
        });
      } else {
        let listItem = document.createElement("li");
        listItem.textContent = "Nenhum uso de armazenamento detectado.";
        storageList.appendChild(listItem);
      }

      // Exibe informações dos cookies
      if (response && response.cookiesInfo) {
        let firstParty = response.cookiesInfo.firstPartyCookies;
        let thirdParty = response.cookiesInfo.thirdPartyCookies;
        let totalCookies = response.cookiesInfo.totalCookies;

        let listItem = document.createElement("li");
        listItem.textContent = `Total de cookies: ${totalCookies}`;
        cookieList.appendChild(listItem);

        listItem = document.createElement("li");
        listItem.textContent = `Cookies de primeira parte - Sessão: ${firstParty.session}, Persistentes: ${firstParty.persistent}`;
        cookieList.appendChild(listItem);

        listItem = document.createElement("li");
        listItem.textContent = `Cookies de terceira parte - Sessão: ${thirdParty.session}, Persistentes: ${thirdParty.persistent}`;
        cookieList.appendChild(listItem);} 
      else {
      let listItem = document.createElement("li");
      listItem.textContent = "Nenhum cookie detectado.";
      cookieList.appendChild(listItem);
    }
    
    if (response && response.canvasFingerprintingAlerts.length > 0) {
      response.canvasFingerprintingAlerts.forEach((alert) => {
        let listItem = document.createElement("li");
        listItem.textContent = alert;
        fingerprintingList.appendChild(listItem);
      });
    } else {
      let listItem = document.createElement("li");
      listItem.textContent = "Nenhuma tentativa de fingerprinting de canvas detectada.";
      fingerprintingList.appendChild(listItem);
    }

    });
  });
  