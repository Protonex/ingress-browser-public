(function () {

  console.log("starting client.js for betaspike");


  var baseUrl   = 'https://m-dot-betaspike.appspot.com/rpc',
      body      = document.body.textContent,
      xsrfToken = port = json = null;


  // If the first five characters of the body are "while", we got a valid handshake.
  if (body.substr(0, 5) !== 'while') {
    console.log('Invalid SACSID cookie. Waiting for login.');
    return;
  }


  // Remove surrounding "while" loop from body and parse the handshake.
  try {
    json      = JSON.parse(body.substr(9, body.length - 9));
    xsrfToken = json.result.xsrfToken;
  } catch (ex) {
    // TODO: better error handling.
    return;
  }


  // Connect to the background page.
  port = chrome.extension.connect({ name: 'iic_betaspike' })
  port.onMessage.addListener(handleCommand);


  // Tell the background page that we are logged in and got the xsrfTooken.
  port.postMessage({ type: 'handshakeSuccessful' });


  /**
   * Handles messages from the backoungs script.
   * @param  {object} msg msg object contains a "type" and optional "params".
   */
  function handleCommand(msg) {

    var params = { params: msg.params };

    switch (msg.type) {
      // Log in was successful, now close the tab so it can be reopened in an iframe.
      case 'closeTab':
        window.close();
      break;

      // collectItemsFromPortalRequest
      case 'collectItemsFromPortalRequest':
        console.log('received collectItemsFromPortalRequest');
//        for (var i=0;i<50;++i)
        doPost('gameplay/collectItemsFromPortal', params, function (response) {
          port.postMessage({
            type: 'collectItemsFromPortalResponse',
            response: response
          });
        });
      break;

      // getInventoryRequest
      case 'getInventoryRequest':
        console.log('received getInventoryRequest()');
        doPost('playerUndecorated/getInventory', params, function (response) {
          port.postMessage({
            type: 'getInventoryResponse',
            inventory: response
          });
        });
      break;
    }

  }


  /**
   * Executes a POST request to the betaspike appEngine backend.
   * @param  {string}   url      The name of the rpc request.
   * @param  {object}   data     Data to be sent in the POST body.
   * @param  {Function} callback Will be called on success.
   */
  function doPost(url, data, callback) {

    url = baseUrl +'/'+ url;
    var xhr = new XMLHttpRequest();

    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        console.log('POST request to '+ url +' returned. status code '+ xhr.status);
        if (xhr.status === 200) {
          callback(JSON.parse(xhr.responseText));
        }
      }
    }

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.setRequestHeader('X-XsrfToken', xsrfToken);
    xhr.send(JSON.stringify(data));

  }


}());
