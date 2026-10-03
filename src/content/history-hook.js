// Runs in the page's MAIN world (manifest content_scripts, "world": "MAIN").
// Content scripts live in an isolated world and cannot observe the page's own
// History API calls, so this hook patches the page's history and re-broadcasts
// SPA navigations as a DOM event the content script can listen for.
(function () {
  var fire = function () {
    window.dispatchEvent(new CustomEvent('manifest:url-change'));
  };
  ['pushState', 'replaceState'].forEach(function (name) {
    var original = history[name].bind(history);
    history[name] = function () {
      var result = original.apply(null, arguments);
      fire();
      return result;
    };
  });
})();
