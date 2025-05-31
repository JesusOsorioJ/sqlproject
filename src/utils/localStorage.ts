export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    const json = JSON.stringify(data);
    window.localStorage.setItem(key, json);
  } catch (e) {
    console.error("Error al guardar en localStorage:", e);
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const json = window.localStorage.getItem(key);
    if (!json) return null;
    return JSON.parse(json) as T;
  } catch (e) {
    console.error("Error al leer de localStorage:", e);
    return null;
  }
}
