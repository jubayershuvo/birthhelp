"use client";

import { decryptFile } from "@/lib/decryptFile";
import axios from "axios";
import { useState } from "react";

export default function HomePage() {
    const [isShown, setIsShown] = useState(false);

  const [data, setData] = useState({name: ""});
  async function fetchAndDecrypt() {
    try {
      const res = await axios.get("/api/data/ministry/search", {
        responseType: "arraybuffer", // important for binary data
      });

      const arrayBuffer = res.data as ArrayBuffer;
      const result = decryptFile<{ name: string }>(arrayBuffer);
      const dataApi = {
        name: result?.name || "",
      }

      setData(dataApi);
    } catch (err) {
      console.error("Failed to fetch or decrypt:", err);
      alert("Error fetching or decrypting data. Check console.");
    }
  }

  return (
    <div className="p-4">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={fetchAndDecrypt}
      >
        Fetch & Decrypt Data
      </button>
      <button onClick={() => setIsShown(!isShown)}>Show name</button>
      {isShown && data && Object.entries(data).map(([key, value]) => (
        <p key={key}>{key}: {value}</p>
      ))}
    </div>
  );
}
