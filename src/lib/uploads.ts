/** Turn stored paths like `/uploads/file.pdf` into a URL that hits the API server (not the SPA host). */
export function resolveUploadUrl(path?: string | null): string {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  const uploadsBase = import.meta.env.VITE_UPLOADS_BASE_URL as string | undefined;
  if (uploadsBase) {
    return `${uploadsBase.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  }

  // Local dev: Vite proxies `/uploads` → backend
  if (import.meta.env.DEV) {
    return path;
  }

  const apiUrl =
    (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:3001/api";
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
