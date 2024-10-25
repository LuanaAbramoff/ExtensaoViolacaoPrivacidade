document.addEventListener("DOMContentLoaded", () => {
  // Solicita as conexões de terceiros do background.js
  browser.runtime.sendMessage({ action: "getConnections" })
    .then((response) => {
      console.log("Dentro do popup.js");
      console.log("RESPOSTA É:", response);

      const connectionList = document.getElementById("connection-list");
      const portList = document.getElementById("port-list");
      const scoreDisplay = document.getElementById("score-display");
      const storageList = document.getElementById("storage-list");
      const cookieList = document.getElementById("cookie-list");
      const fingerprintingList = document.getElementById("fingerprinting-list");
      const expandButton = document.getElementById("expand-button");

      connectionList.innerHTML = "";
      portList.innerHTML = "";
      storageList.innerHTML = "";
      cookieList.innerHTML = "";
      fingerprintingList.innerHTML = "";

      // Atualiza a barra de pontuação
      const score = response.score || 100; // Supondo que o score seja enviado
      scoreDisplay.textContent = score;
      const scoreBar = document.getElementById("score-bar");
      scoreBar.style.width = `${score}%`;

      // Definindo a cor da barra de score
      if (score > 90) {
        scoreBar.style.backgroundColor = "green";
      } else if (score > 70) {
        scoreBar.style.backgroundColor = "yellow";
      } else if (score > 30) {
        scoreBar.style.backgroundColor = "orange";
      } else {
        scoreBar.style.backgroundColor = "red";
      }

      // Checa se a resposta contém os dados esperados
      if (response && response.thirdPartyConnections) {
        const connectionsToShow = response.thirdPartyConnections.slice(0, 5);
        connectionsToShow.forEach((domain) => {
          let listItem = document.createElement("li");
          listItem.textContent = domain;
          connectionList.appendChild(listItem);
        });

        if (response.thirdPartyConnections.length > 5) {
          expandButton.style.display = "block";
          expandButton.onclick = () => {
            response.thirdPartyConnections.forEach((domain) => {
              let listItem = document.createElement("li");
              listItem.textContent = domain;
              connectionList.appendChild(listItem);
            });
            expandButton.style.display = "none"; // Esconde o botão após expandir
          };
        } else {
          expandButton.style.display = "none"; // Esconde o botão se não houver mais de 5 domínios
        }
      } else {
        let listItem = document.createElement("li");
        listItem.textContent = "Nenhuma conexão de terceiro detectada.";
        connectionList.appendChild(listItem);
      }

      // Exibe portas abertas
      if (response && response.openPorts && response.openPorts.length > 0) {
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

      // Exibe uso de armazenamento detectado
      if (response && response.storageUsage && response.storageUsage.length > 0) {
        response.storageUsage.forEach((storage) => {
          let listItem = document.createElement("li");
          listItem.textContent = storage;
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
        cookieList.appendChild(listItem);
      } else {
        let listItem = document.createElement("li");
        listItem.textContent = "Nenhum cookie detectado.";
        cookieList.appendChild(listItem);
      }

      // Exibe tentativas de fingerprinting de canvas
      if (response && response.canvasFingerprintingAlerts && response.canvasFingerprintingAlerts.length > 0) {
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
    })
    .catch((error) => {
      console.error("Erro ao obter a resposta:", error);
    });
});
