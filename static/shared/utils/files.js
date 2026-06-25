(function initNtiSharedFiles(global) {
  const root = global.NTIShared || (global.NTIShared = {});

  function normalizeExtensions(extensions) {
    return (extensions || []).map((ext) => {
      const value = String(ext || "").trim().toLowerCase();
      return value.startsWith(".") ? value : `.${value}`;
    });
  }

  root.files = {
    getExtension(fileName) {
      const name = String(fileName || "");
      const index = name.lastIndexOf(".");
      if (index < 0) {
        return "";
      }
      return name.slice(index).toLowerCase();
    },

    hasExtension(fileOrName, extensions) {
      const name = typeof fileOrName === "string" ? fileOrName : fileOrName?.name;
      const ext = this.getExtension(name);
      return normalizeExtensions(extensions).includes(ext);
    },

    validateSize(file, maxBytes) {
      if (!file || typeof file.size !== "number") {
        return false;
      }
      if (file.size === 0) {
        return false;
      }
      return file.size <= maxBytes;
    },

    validateSingleFile(fileList) {
      if (!fileList || fileList.length !== 1) {
        return null;
      }
      return fileList[0];
    },

    preventDocumentDrop() {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        document.addEventListener(eventName, (event) => {
          event.preventDefault();
          event.stopPropagation();
        });
      });
    },

    bindDropZone(options) {
      const element = options?.element;
      if (!element) {
        return;
      }

      const dragOverClass = options.dragOverClass || "drag-over";
      const onFiles = typeof options.onFiles === "function" ? options.onFiles : () => {};

      element.addEventListener("dragenter", () => {
        element.classList.add(dragOverClass);
      });
      element.addEventListener("dragover", (event) => {
        event.preventDefault();
        element.classList.add(dragOverClass);
      });
      element.addEventListener("dragleave", (event) => {
        if (!element.contains(event.relatedTarget)) {
          element.classList.remove(dragOverClass);
        }
      });
      element.addEventListener("drop", (event) => {
        event.preventDefault();
        element.classList.remove(dragOverClass);
        onFiles(event.dataTransfer?.files);
      });

      if (options.clickInput) {
        element.addEventListener("click", () => options.clickInput.click());
        element.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            options.clickInput.click();
          }
        });
      }
    },
  };
})(window);
