import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S3_3_Installments: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Fee Setup" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="3.3" title="Step 3: Add Installments" />
          <Sequence from={15} durationInFrames={700}>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: "sans-serif" }}>Tuition Fee</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "sans-serif" }}>Total: ₹24,000</div>
                </div>
              </div>
              <MockTable headers={["Installment", "Amount", "Due Date"]} rows={[
                ["1st Quarter", "₹6,000", "Apr 15, 2025"],
                ["2nd Quarter", "₹6,000", "Jul 15, 2025"],
                ["3rd Quarter", "₹6,000", "Oct 15, 2025"],
                ["4th Quarter", "₹6,000", "Jan 15, 2026"],
              ]} delay={10} />
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={150}><StepCaption step={1} text="Expand a fee structure by clicking the chevron" /></Sequence>
          <Sequence from={150} durationInFrames={200}><StepCaption step={2} text='Click "+ Add Installment" — enter Name, Amount, Due Date' /></Sequence>
          <Sequence from={350} durationInFrames={200}><StepCaption text="💡 Installment amounts should add up to the total fee amount" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
