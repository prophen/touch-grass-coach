import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Sprig welcomes you to Touch Grass Coach: Get roasted. Go outside. Grow something.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const sprig = await readFile(join(process.cwd(), "public/mascots/sprout.png"));
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "linear-gradient(135deg, #dbf3df, #fbfbdc)", color: "#214536", padding: 52, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", width: "100%", border: "3px solid #214536", borderRadius: 32, background: "#ffffff", padding: 44, alignItems: "center", justifyContent: "space-between", boxShadow: "8px 8px 0 #214536" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 650 }}>
          <div style={{ display: "flex", fontSize: 19, letterSpacing: 4, marginBottom: 24 }}>AN OPEN-WEIGHT INTERVENTION</div>
          <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 1.05 }}>Touch Grass Coach</div>
          <div style={{ display: "flex", fontSize: 31, lineHeight: 1.4, marginTop: 28 }}>Get roasted. Go outside. Grow something.</div>
          <div style={{ display: "flex", fontSize: 21, marginTop: 34, color: "#547361" }}>Your chaotic garden, powered by Gemma.</div>
        </div>
        <img src={`data:image/png;base64,${sprig.toString("base64")}`} width={290} height={350} style={{ objectFit: "contain" }} alt="" />
      </div>
    </div>,
    size,
  );
}
