(function () {
  var script = document.currentScript;
  if (!script || document.getElementById('hasc-assistant-widget')) return;

  var baseUrl = new URL(script.src).origin;
  var root = document.createElement('div');
  root.id = 'hasc-assistant-widget';
  root.innerHTML =
    '<button type="button" aria-label="Open HASC admissions assistant" style="position:fixed;right:20px;bottom:20px;z-index:2147483646;width:58px;height:58px;border:0;border-radius:18px 18px 18px 5px;background:#f4c537;color:#162238;font:700 13px Arial,sans-serif;box-shadow:0 10px 30px rgba(19,34,56,.24);cursor:pointer">HA</button>' +
    '<div style="display:none;position:fixed;right:20px;bottom:90px;z-index:2147483645;width:min(390px,calc(100vw - 28px));height:min(720px,calc(100vh - 112px));border-radius:20px;overflow:hidden;box-shadow:0 20px 65px rgba(19,34,56,.24);background:#f7f4ed">' +
    '<iframe title="HASC admissions assistant" src="' +
    baseUrl +
    '/embed" style="width:100%;height:100%;border:0;background:#f7f4ed"></iframe></div>';

  var button = root.firstElementChild;
  var panel = root.lastElementChild;
  button.addEventListener('click', function () {
    var isOpen = panel.style.display === 'block';
    panel.style.display = isOpen ? 'none' : 'block';
    button.setAttribute('aria-expanded', String(!isOpen));
  });
  document.body.appendChild(root);
})();