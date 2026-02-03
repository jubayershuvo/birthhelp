import { File } from "formdata-node";
import fs from "fs";
import path from "path";
import mime from "mime-types";

export function nodeFileToWebFile(filePath: string) {
  const buffer = fs.readFileSync(filePath);

  const filename = path.basename(filePath);
  const mimeType = mime.lookup(filename) || "application/octet-stream";

  return new File([buffer], filename, {
    type: mimeType,
  });
}
