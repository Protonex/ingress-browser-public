

document.addEventListener('DOMContentLoaded', function () {
    var bgpage = chrome.extension.getBackgroundPage();
    bgpage.renderInventory(function (html) {
        document.getElementById("inventory").innerHTML = html;
    });
});
