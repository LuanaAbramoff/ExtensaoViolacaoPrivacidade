document.addEventListener("DOMContentLoaded", () => {
  // Solicita as conexões de terceiros do background.js
  browser.runtime.sendMessage({ action: "getConnections" }, (response) => {
    const connectionList = document.getElementById("connection-list");
    connectionList.innerHTML = "";

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
  });
});
