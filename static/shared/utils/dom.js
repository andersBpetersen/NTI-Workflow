(function initNtiSharedDom(global) {
  const root = global.NTIShared || (global.NTIShared = {});

  root.dom = {
    byId(id) {
      return document.getElementById(id);
    },

    setText(element, text) {
      if (element) {
        element.textContent = text == null ? "" : String(text);
      }
    },

    show(element) {
      element?.classList.remove("hidden");
    },

    hide(element) {
      element?.classList.add("hidden");
    },

    on(element, eventName, handler) {
      element?.addEventListener(eventName, handler);
    },
  };
})(window);
