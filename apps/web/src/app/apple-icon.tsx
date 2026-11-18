import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — same 16×16 arcade M crate as the favicon, scaled up. */
export default function AppleIcon() {
  const cell = 180 / 16;
  const layers = [
    rect(0, 0, 16, 16, "#2a3340"),
    rect(1, 1, 14, 14, "#EFCF8E"),
    rect(2, 2, 12, 3, "#F5D9A0"),
    rect(2, 5, 12, 3, "#E8C480"),
    rect(2, 8, 12, 3, "#F5D9A0"),
    rect(2, 11, 12, 3, "#E2BC78"),
    rect(2, 4, 12, 1, "#D0A868"),
    rect(2, 7, 12, 1, "#D0A868"),
    rect(2, 10, 12, 1, "#D0A868"),
    rect(1, 1, 14, 1, "#FFF0C8"),
    rect(1, 1, 1, 14, "#FFF0C8"),
    rect(14, 1, 1, 14, "#B88848"),
    rect(1, 14, 14, 1, "#B88848"),
    rect(4, 3, 2, 10, "#1a2230"),
    rect(10, 3, 2, 10, "#1a2230"),
    rect(6, 4, 1, 2, "#1a2230"),
    rect(9, 4, 1, 2, "#1a2230"),
    rect(7, 6, 2, 2, "#1a2230"),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#2a3340",
        }}
      >
        {layers.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x * cell,
              top: p.y * cell,
              width: p.w * cell,
              height: p.h * cell,
              background: p.color,
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}

function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): { x: number; y: number; w: number; h: number; color: string } {
  return { x, y, w, h, color };
}
