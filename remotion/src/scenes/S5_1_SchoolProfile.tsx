import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S5_1_SchoolProfile: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Settings" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="5.1" title="School Profile" />
          <Sequence from={10} durationInFrames={700}>
            <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
              {["School", "Security", "Templates"].map((tab, i) => (
                <div key={tab} style={{ padding: "10px 24px", fontSize: 14, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "#a5b4fc" : "rgba(255,255,255,0.5)", borderBottom: i === 0 ? "2px solid #6366f1" : "2px solid transparent", fontFamily: "sans-serif" }}>{tab}</div>
              ))}
            </div>
          </Sequence>
          <Sequence from={20} durationInFrames={700}>
            <MockForm title="School Settings" fields={[
              { label: "School Name", value: "Delhi Public School" },
              { label: "Address", value: "123 Education Lane, New Delhi" },
              { label: "Phone", value: "+91 11 2345 6789" },
              { label: "Email", value: "admin@dps.edu.in" },
              { label: "UPI ID", value: "dps@upi" },
            ]} buttonText="Save Settings" delay={0} />
          </Sequence>
          <Sequence from={0} durationInFrames={200}><StepCaption step={1} text="Update School Name, Address, Phone, Email, and UPI ID" /></Sequence>
          <Sequence from={200} durationInFrames={200}><StepCaption step={2} text='Click "Save Settings" after making changes' /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
