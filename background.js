
console.log("starting background.js");


var baseUrl          = 'https://m-dot-betaspike.appspot.com',
    isLoggedIn       = false,
    port_ingress     = null,
    port_betaspike   = null,

    handshakePayload = {
      "nemesisSoftwareVersion": "2013-06-17T22:55:32Z 2d12f990c905 opt",
      "deviceSoftwareVersion": "4.2.2"
    },
    handshakeUrl     = baseUrl + '/handshake?json=' + JSON.stringify(handshakePayload);




function Inventory() {
  this.callbacks = [];
  this.isFetching = false;
  this.origInventory = {};
  this.inventory = null;
}

Inventory.prototype.handleResponse = function (msg) {
  this.origInventory = msg.inventory;
  this.inventory = this.translateInventory();
  this.callbacks.forEach(function (callback) {
    callback(this.inventory);
  }, this);
  this.callbacks = [];
  this.isFetching = false;
};

Inventory.prototype.fetchInventory = function () {
  this.isFetching = true;
  port_betaspike.postMessage({
    type: 'getInventoryRequest',
    params: {
      lastQueryTimestamp: 0
    }
  });
};

Inventory.prototype.getInventory = function (callback) {
  this.callbacks.push(callback);
  if (!this.isFetching && this.inventory === null) {
    this.fetchInventory();
  } else {
    callback(this.inventory);
  }
};

Inventory.prototype.translateInventory = function () {
  var inventory = {
    resonators: [{ guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }],
    burster: [{ guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }],
    media: [{ guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }],
    shields: { "COMMON": [], "RARE": [],  "VERY_RARE": [] },
    keys: {}
  };
  for (var key in this.origInventory.gameBasket.inventory) {
    var item = this.origInventory.gameBasket.inventory[key];
    if (typeof item[2].resourceWithLevels !== "undefined") {
      if (item[2].resourceWithLevels.resourceType === "EMITTER_A") {
        inventory.resonators[item[2].resourceWithLevels.level - 1].guids.push(item[0]);
      } else if (item[2].resourceWithLevels.resourceType === "EMP_BURSTER") {
        inventory.burster[item[2].resourceWithLevels.level - 1].guids.push(item[0]);
      } else if (item[2].resourceWithLevels.resourceType === "MEDIA") {
        inventory.media[item[2].resourceWithLevels.level - 1].guids.push(item[0]);
      }
    } else if (typeof item[2].modResource !== "undefined") {
      if (item[2].modResource.resourceType === "RES_SHIELD") {
        inventory.shields[item[2].modResource.rarity].push(item[0]);
      }
    } else if (typeof item[2].resource !== "undefined") {
      if (item[2].resource.resourceType === "PORTAL_LINK_KEY") {
        if (typeof inventory.keys[item[2].portalCoupler.portalGuid] === "undefined") {
          inventory.keys[item[2].portalCoupler.portalGuid] = [];
        }
        inventory.keys[item[2].portalCoupler.portalGuid].push({
          title: item[2].portalCoupler.portalTitle,
          address: item[2].portalCoupler.portalAddress,
          image: item[2].portalCoupler.portalImageUrl,
          location: item[2].portalCoupler.portalLocation,
          portalGuid: item[2].portalCoupler.portalGuid,
          guid: item[0]
        });
      }
    }
  }
  return inventory;
};




var inventory = new Inventory();




chrome.extension.onConnect.addListener(function (port) {
  ///////////////////////////////////////////
  // betaspike port
  if (port.name === 'iic_betaspike') {
    port_betaspike = port;

    port_betaspike.onMessage.addListener(function (msg) {
      switch (msg.type) {

        // collectItemsFromPortalResponse
        case 'collectItemsFromPortalResponse':
          console.log('received collectItemsFromPortalResponse');
          port_ingress.postMessage(msg);
        break;

        // getInventoryResponse
        case 'getInventoryResponse':
          console.log('received getInventoryResponse');
          inventory.handleResponse(msg);
        break;

        // handshakeSuccessful
        case 'handshakeSuccessful':
          if (!isLoggedIn) {
            port.postMessage({ type: "closeTab" });
            document.getElementById("betaspike").src = handshakeUrl;
            isLoggedIn = true;
          }
          console.log('Handshake successful. Closing tab and reopening in iframe.');
        break;
      }
    });
  }

  ///////////////////////////////////////////
  // ingress port
  else if (port.name === 'iic_ingress') {
    port_ingress = port;

    port_ingress.onMessage.addListener(function (msg) {
      switch (msg.type) {

        // collectItemsFromPortalRequest
        case 'collectItemsFromPortalRequest':
          console.log('received collectItemsFromPortalRequest');
          port_betaspike.postMessage(msg);
        break;

        // getInventoryRequest
        case 'getInventoryRequest':
          console.log('received getInventoryRequest');
          inventory.getInventory(function (inventory) {
            port_ingress.postMessage({ type: "getInventoryResponse", inventory: inventory });
          });
        break;

        case 'isLoggedInRequest':
          port_ingress.postMessage({
            type: 'isLoggedInResponse',
            loggedIn: isLoggedIn
          });
        break;
      }
    });
  }
});


var renderCallback = null;

function renderInventory(callback) {
  renderCallback = callback;
  inventory.getInventory(function (inventory) {
    var iframe = document.getElementById('sandbox');
    var message = {
      command: 'render',
      name: 'inventory',
      context: inventory
    };
    iframe.contentWindow.postMessage(message, '*');
  });
}

window.addEventListener('message', function (event) {
  renderCallback(event.data.html);
}, true);



document.addEventListener('DOMContentLoaded', function () {

  if (!isLoggedIn) {
    console.log('not logged in');
    window.open(handshakeUrl);
  }

}, false);
