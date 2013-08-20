console.log("starting client.js for ingress");

function Geo() {}
Geo.prototype.hex2geo = function (hex) {
    return parseInt(hex, 16) / 1000000;
};
Geo.prototype.geo2hex = function (geo) {
    geo *= 1000000;
    var hex = geo.toString(16),
        len = 8;
    if (hex.indexOf("-") > -1) {
      hex = (parseInt("ffffffff", 16) - parseInt(hex.substr(1), 16)).toString(16);
    }
    while (hex.length < len) {
        hex = "0" + hex;
    }
    return hex;
};
Geo.prototype.geo2hex_pair = function (geo) {
    geo = geo.map(function(coord) { return this.geo2hex(coord); }.bind(this));
    return geo.join(',');
};

var port = chrome.extension.connect({ name: 'iic_ingress' }),
    dom_port = chrome.extension.connect(),
    loggedIn = false;

port.onMessage.addListener(function(msg) {
  switch (msg.type) {
  case 'collectItemsFromPortalResponse':
    onCollectItemsFromPortal(msg.response);
  break;

  case 'getInventoryResponse':
    onGetInventory(msg.inventory);
  break;

  case 'isLoggedInResponse':
    onIsLoggedIn(msg.loggedIn);
  break;
  }
});

window.addEventListener('message', function(msg) {
  switch (msg.data.type) {
  case 'collectItemsFromPortalRequest':
    collectItemsFromPortal(msg.data.portal);
  break;

  case 'fireUntargeted':
    getInventory();
  break;

  default:
  break;
  }
});

var hookDom = function() {
  var s = document.createElement("script");
  s.src = chrome.extension.getURL("client_inject.js");

  s.onload = function() {
    this.parentNode.removeChild(this);
  };
  (document.head || document.documentElement).appendChild(s);
}

var onIsLoggedIn = function(state) {
  if (state) {
    loggedIn = true;
    console.log('YAY. the backend says we\'re logged in!');

//    getInventory();
    hookDom();
  }
}

var isLoggedIn = function() {
  port.postMessage({ type: 'isLoggedInRequest' });
}

var onCollectItemsFromPortal = function(response) {
  console.log('successfully hacked. response = ', response);
  window.postMessage({
    type: 'collectItemsFromPortalResponse',
    result: response
  }, "*");
}

var collectItemsFromPortal = function(portal) {
  var params = {
    clientBasket: {
      clientBlob: null
    },
    energyGlobGuids: [],
    itemGuid: portal.a,
    knobSyncTimestamp: 0,
    playerLocation: new Geo().geo2hex_pair([portal.lat,portal.lng])
  };

  port.postMessage({
    type: 'collectItemsFromPortalRequest',
    params: params
  });
}

var onGetInventory = function(inventory) {
  console.log('received inventory');
  window.postMessage({
    type: 'getInventoryResponse',
    result: inventory
  }, "*");
}

var getInventory = function() {
  port.postMessage({
    type: 'getInventoryRequest',
    params: {
      lastQueryTimestamp: 0
    }
  });
}

isLoggedIn();
