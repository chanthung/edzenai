import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S5_2_PaymentQR: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Settings" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="5.2" title="Payment QR Code" />
          <Sequence from={15} durationInFrames={600}>
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
              <div style={{ border: "2px dashed rgba(99,102,241,0.4)", borderRadius: 16, padding: 40, textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, fontFamily: "sans-serif" }}>Upload UPI QR Code</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "sans-serif", marginTop: 8 }}>Shown to parents for easy payments</div>
              </div>
              <div style={{ width: 200, height: 200, borderRadius: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", opacity: interpolate(frame - 60, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 64 }}>📱</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "sans-serif", marginTop: 8 }}>QR Preview</div>
                </div>
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={200}><StepCaption step={1} text="Upload your UPI QR code image" /></Sequence>
          <Sequence from={200} durationInFrames={200}><StepCaption text="QR code is displayed in the parent view for easy payments" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
