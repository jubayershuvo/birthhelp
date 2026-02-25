import fs from "fs";
import path from "path";

export function saveHtmlDebug(html: unknown): string | null {
  try {
    // Validate input
    if (typeof html !== "string" || !html.trim()) {
      console.warn("Invalid HTML input");
      return null;
    }

    // Prevent very large writes (5MB limit)
    if (html.length > 5_000_000) {
      console.warn("HTML too large to save");
      return null;
    }

    const timestamp = Date.now();

    // Create safe debug directory inside project
    const debugDir = path.join(process.cwd(), "tmp");

    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    const filePath = path.join(debugDir, `response_${timestamp}.html`);

    // Prevent overwrite using "wx"
    fs.writeFileSync(filePath, html, {
      encoding: "utf8",
      flag: "wx",
    });

    console.log(`HTML saved at: ${filePath}`);

    return filePath;
  } catch (error) {
    console.error("saveHtmlDebug error:", error);
    return null;
  }
}