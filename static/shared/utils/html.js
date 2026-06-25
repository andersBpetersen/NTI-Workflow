(function initNtiSharedHtml(global) {
  const root = global.NTIShared || (global.NTIShared = {});

  root.html = {
    escape(value) {
      if (value == null) {
        return "";
      }
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    },
  };
})(window);
