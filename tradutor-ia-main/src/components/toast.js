const toastStack = document.querySelector("[data-toast-stack]");

export function showToast(message, variant = "info") {
  if (!toastStack) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${variant}`;
  toast.textContent = message;

  toastStack.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    toast.addEventListener("animationend", () => toast.remove(), {
      once: true,
    });
  }, 3200);
}
