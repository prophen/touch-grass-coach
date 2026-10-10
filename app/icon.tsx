import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const sprig = await readFile(join(process.cwd(), "public/mascots/sprout.png"));
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#e5f5d8", borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
      <img src={`data:image/png;base64,${sprig.toString("base64")}`} width={60} height={60} style={{ objectFit: "contain" }} alt="" />
    </div>,
    size,
  );
}
