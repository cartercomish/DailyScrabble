import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — same M crate as the favicon, larger. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2a3340",
        }}
      >
        <div
          style={{
            width: 156,
            height: 156,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #F5D9A0 0%, #E8C480 50%, #E2BC78 100%)",
            border: "6px solid #2a3340",
            boxShadow: "inset 3px 3px 0 #FFF0C8, inset -3px -3px 0 #B88848",
            color: "#1a2230",
            fontSize: 96,
            fontWeight: 800,
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            lineHeight: 1,
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size },
  );
}
