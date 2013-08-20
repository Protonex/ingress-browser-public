function translateItems(items) {
  var inventory = {
    resonators: [{ guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }],
    burster: [{ guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }],
    virus: {"JARVIS": [], "ADA": []},
    cubes: [{ guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }],
    shields: {"COMMON": [], "RARE": [],  "VERY_RARE": [] },
    keys: {guids: []},
    media: [{ guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }, { guids: [] }]
  };
  for (var key in items) {
    var item = items[key];
    if (typeof item[2].resourceWithLevels !== "undefined") {
      if (item[2].resourceWithLevels.resourceType === "EMITTER_A") {
        inventory.resonators[item[2].resourceWithLevels.level - 1].guids.push(item[0]);
      } else if (item[2].resourceWithLevels.resourceType === "EMP_BURSTER") {
        inventory.burster[item[2].resourceWithLevels.level - 1].guids.push(item[0]);
      } else if (item[2].resourceWithLevels.resourceType === "POWER_CUBE") {
        inventory.cubes[item[2].resourceWithLevels.level -1].guids.push(item[0]);
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
        inventory.keys.guids.push(item[0]);
      }
      if (item[2].resource.resourceType === "FLIP_CARD") inventory.virus[item[2].flipCard.flipCardType].push(item[0]);
    }
  }
  return inventory;
}

function map(item) {
  return item.guids.length;
}

function generateText(label, items, itemWithLevel) {
  if(typeof itemWithLevel === 'undefined') itemWithLevel = true;
  var i;
  var string = "<div style=\"width:50%;float:left;min-height:24px;\">" + label + ": ";
  for (i = 0, len = items.length; i < len; i += 1) {
    if(itemWithLevel) {
      if(items[i] > 0) string +=  "<span class=\"resonator_level_" + (i + 1) + "\" style=\"color:#fff;padding:0 3px;display:inline-block;text-align:center;margin: 1px 0;\">" + items[i] + "</span> ";
    } else {
      string +=  "<span style=\"background:#666;color:#fff;padding:0 3px;display:inline-block;text-align:center;margin: 1px 0;\">" + items[i] + "</span> ";
    }
  }
  string +=  "</div>";
  return string;
}

function createResultText(items) {
  var resonators = items.resonators.map(map);
  var burster = items.burster.map(map);
  var virus = [items.virus['JARVIS'].length, items.virus['ADA'].length];
  var cubes = items.cubes.map(map);
  var shields = [items.shields['COMMON'].length, items.shields['RARE'].length, items.shields['VERY_RARE'].length];
  var keys = [items.keys.guids.length];
  var media = items.media.map(map);
  var string = "";
  string += generateText("Resonator", resonators);
  string += generateText("Burster", burster);
  string += generateText("Virus", virus, false);
  string += generateText("Cubes", cubes);
  string += generateText("Shields", shields, false);
  string += generateText("Keys", keys, false);
  // string += generateText("Media", media);
  return string;
}

var items = [];
var global_inventory = null;
var error_msg = {
  "TOO_SOON_5_SECS": "Cool Down In 5 Seconds...",
  "TOO_SOON_10_SECS": "Cool Down In 10 Seconds...",
  "TOO_SOON_20_SECS": "Cool Down In 20 Seconds...",
  "TOO_SOON_30_SECS": "Cool Down In 30 Seconds...",
  "TOO_SOON_60_SECS": "Cool Down In 60 Seconds...",
  "TOO_SOON_120_SECS": "Cool Down In 120 Seconds...",
  "TOO_SOON_240_SECS": "Cool Down In 240 Seconds...",
  "TOO_SOON_BIG": "Cool Down In 300 Seconds...",
  "TOO_OFTEN": "Portal Burned Out..."
}

window.addEventListener('message', function(msg) {
  switch (msg.data.type) {
    case 'collectItemsFromPortalResponse':
      var result = msg.data.result;
      items = items.concat(result.gameBasket.inventory);
      var addedItems = translateItems(items);
      var resultText = createResultText(addedItems);
      if (typeof result.error !== 'undefined' && !items.length) document.getElementById('hack_status').innerHTML = "Unsuccessful: " + ((typeof error_msg[result.error] !== 'undefined')?error_msg[result.error]:result.error);
      else document.getElementById('hack_status').innerHTML = resultText;
      break;

    default:
      break;
  }
});

var old_onAdd = W.prototype.onAdd;
var new_onAdd = function() {
  old_onAdd.call(this);

  var tab_title = document.createElement('div');
  tab_title.id = 'pi-tab-actions';
  tab_title.classList.add('portal_tab_title');
  tab_title.appendChild(document.createTextNode('ACTIONS'));

  if(document.getElementById('portal_tab_group_decorator')) document.getElementById('portal_tab_group_decorator').appendChild(tab_title);

  var tab_content_actions = document.createElement('div');
  tab_content_actions.id = 'tab_content_actions';
  tab_content_actions.style.display = 'none';

  var row = document.createElement('div');
  row.classList.add('portal_details_row');

  var styledCont = document.createElement('div');

  styledCont.style.padding = '0 1em';
  styledCont.style.overflowY = 'auto';
  styledCont.style.width = '97%';
  styledCont.style.height = '100px';
  styledCont.style.boxSizing = 'border-box';

  var hack = document.createElement('span');
  hack.innerText = 'HACK';

  var hack_status = document.createElement('div');
  hack_status.style.position = 'relative';
  hack_status.style.top = '3px';
  hack_status.id = 'hack_status';
  hack_status.innerText = '';

  hack.addEventListener('click', function() {
    document.getElementById('hack_status').innerText = '...';
    items = [];
    window.postMessage({
      type: 'collectItemsFromPortalRequest',
      portal: this.c
    }, "*");
  }.bind(this), false);

  styledCont.appendChild(hack);
  styledCont.appendChild(hack_status);

  row.appendChild(styledCont);

  tab_content_actions.appendChild(row);
  if(document.getElementById('portal_tabs_container')) document.getElementById('portal_tabs_container').appendChild(tab_content_actions);

  var tab_title_res = document.getElementById('pi-tab-res'),
      tab_title_mod = document.getElementById('pi-tab-mod'),
      tab_title_actions = document.getElementById('pi-tab-actions');

  var tab_content_res = document.getElementById('tab_content_res'),
      tab_content_mod = document.getElementById('tab_content_mod'),
      tab_content_actions = document.getElementById('tab_content_actions');

  if(tab_title_actions) tab_title_actions.addEventListener('click', function() {
    tab_title_res.classList.remove('tab_selected');
    tab_title_mod.classList.remove('tab_selected');
    tab_title_actions.classList.add('tab_selected');

    tab_content_res.style.display = 'none';
    tab_content_mod.style.display = 'none';
    tab_content_actions.style.display = 'block';
    tab_content_actions.style.height = '100px';
    tab_content_mod.style.overflow = 'scroll';
  });

  if(tab_title_res) tab_title_res.addEventListener('click', function() {
    tab_title_actions.classList.remove('tab_selected');
    tab_title_mod.classList.remove('tab_selected');
    tab_title_res.classList.add('tab_selected');

    tab_content_actions.style.display = 'none';
    tab_content_mod.style.display = 'none';
    tab_content_res.style.display = 'block';
    tab_content_res.style.height = '100px';
  });

  if(tab_title_mod) tab_title_mod.addEventListener('click', function() {
    tab_title_res.classList.remove('tab_selected');
    tab_title_actions.classList.remove('tab_selected');
    tab_title_mod.classList.add('tab_selected');

    tab_content_res.style.display = 'none';
    tab_content_actions.style.display = 'none';
    tab_content_mod.style.display = 'block';
    tab_content_mod.style.height = '100px';
  });

  //// SHOOT
  /*
  var shoot = function (resonator) {
  }

  var left_container = document.getElementById('resonators_left'),
      right_container = document.getElementById('resonators_right'),
      res_container = [],
      curr = 0,
      i = 0;

  var shoot_status_row = document.createElement('div');
  shoot_status_row.classList.add('portal_details_row');

  var shoot_status = document.createElement('span');
  shoot_status.id = 'shoot_status';

  shoot_status_row.appendChild(shoot_status);
  tab_content_res.appendChild(shoot_status_row);

  for (i=0;i<left_container.childNodes.length;++i) {
    (function(resonator) { left_container.childNodes[i].childNodes[1].addEventListener('click', function() {
        console.log('shooting on', resonator);
    })}(this.c.A[curr++]));
  };

  for (i=0;i<right_container.childNodes.length;++i) {
    (function(resonator) { right_container.childNodes[i].childNodes[1].addEventListener('click', function() {
        console.log('shooting on', resonator);
    })}(this.c.A[curr++]));
  };
  */
}
W.prototype.onAdd = new_onAdd;
