export function createStorage(key, fallbackValue) {
  return {
    get() {
      try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : fallbackValue;
      } catch {
        return fallbackValue;
      }
    },

    set(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        return false;
      }

      return true;
    },

    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        return false;
      }

      return true;
    },
  };
}
