import fs from "fs";
import path from "path";

export async function toDataUri(src?: string | null): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  try {
    if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      const mime = res.headers.get("content-type") || "image/png";
      return `data:${mime};base64,${buf.toString("base64")}`;
    }

    // treat as local file under `public` when it starts with `/`
    let localPath = src;
    if (src.startsWith("/")) {
      localPath = path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
    }
    if (!path.isAbsolute(localPath)) {
      localPath = path.join(process.cwd(), localPath);
    }
    if (fs.existsSync(localPath)) {
      const buf = fs.readFileSync(localPath);
      const ext = path.extname(localPath).toLowerCase();
      let mime = "image/png";
      if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
      if (ext === ".svg") mime = "image/svg+xml";
      if (ext === ".webp") mime = "image/webp";
      return `data:${mime};base64,${buf.toString("base64")}`;
    }
  } catch (e) {
    // Keep errors visible in server logs for easier debugging
    // (do not throw so callers can fallback gracefully)
    // eslint-disable-next-line no-console
    console.error("toDataUri error", e);
    return null;
  }
  return null;
}

export default toDataUri;
