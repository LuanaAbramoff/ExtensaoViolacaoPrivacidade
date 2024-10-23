function monitorStorage(storageType) {
    const originalSetItem = window[storageType].setItem;
    window[storageType].setItem = function (key, value) {
      // Chama a função original
      originalSetItem.apply(this, arguments);
  
      // Envia mensagem para background.js indicando uso de armazenamento
      browser.runtime.sendMessage({
        action: "storageUsed",
        storageType: storageType,
        key: key,
        value: value
      });
    };
  }

  (function() {
    // Função para alertar sobre a tentativa de fingerprinting
    function alertCanvasFingerprinting() {
      console.warn("Tentativa de fingerprinting de canvas detectada!");
      browser.runtime.sendMessage({ action: "canvasFingerprintingDetected" });
    }
  
    // Substitui a função `toDataURL` para monitorar o uso
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      alertCanvasFingerprinting();
      return originalToDataURL.apply(this, args);
    };
  
    // Substitui a função `getImageData` para monitorar o uso
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function(...args) {
      alertCanvasFingerprinting();
      return originalGetImageData.apply(this, args);
    };
  
    // Substitui a função `toBlob` para monitorar o uso
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(...args) {
      alertCanvasFingerprinting();
      return originalToBlob.apply(this, args);
    };
  })();
  
  
  // Monitorar o uso de localStorage e sessionStorage
  monitorStorage("localStorage");
  monitorStorage("sessionStorage");
  