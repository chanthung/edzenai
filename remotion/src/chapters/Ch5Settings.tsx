import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { ChapterTitle } from "../components/ChapterTitle";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

const FPS = 30;

const SchoolProfileScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Settings" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="5.1" title="School Profile" />
          <Sequence from={10} durationInFrames={350}>
            <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
              {["School", "Security", "Templates"].map((tab, i) => (
                <div key={tab} style={{ padding: "10px 24px", fontSize: 14, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "#a5b4fc" : "rgba(255,255,255,0.5)", borderBottom: i === 0 ? "2px solid #6366f1" : "2px solid transparent", fontFamily: "sans-serif" }}>{tab}</div>
              ))}
            </div>
          </Sequence>
          <Sequence from={20} durationInFrames={350}>
            <MockForm
              title="School Settings"
              fields={[
                { label: "School Name", value: "Delhi Public School" },
                { label: "Address", value: "123 Education Lane, New Delhi" },
                { label: "Phone Number", value: "+91 11 2345 6789" },
                { label: "Email", value: "admin@dps.edu.in" },
                { label: "UPI ID", value: "dps@upi" },
              ]}
              buttonText="Save Settings"
              delay={0}
            />
          </Sequence>
          <Sequence from={0} durationInFrames={80}>
            <StepCaption step={1} text="Update School Name, Address, Phone, Email, and UPI ID" />
          </Sequence>
          <Sequence from={80} durationInFrames={80}>
            <StepCaption step={2} text='Click "Save Settings" after making changes' />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PaymentQRScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Settings" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="5.2" title="Payment QR Code" />
          <Sequence from={15} durationInFrames={300}>
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
              {/* Upload area */}
              <div
                style={{
                  border: "2px dashed rgba(99,102,241,0.4)",
                  borderRadius: 16,
                  padding: 40,
                  textAlign: "center",
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, fontFamily: "sans-serif" }}>Upload UPI QR Code</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "sans-serif", marginTop: 8 }}>
                  This will be shown to parents for easy payments
                </div>
              </div>
              {/* QR preview */}
              <div
                style={{
                  width: 200, height: 200, borderRadius: 16,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: interpolate(frame - 60, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 64 }}>📱</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "sans-serif", marginTop: 8 }}>QR Preview</div>
                </div>
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={80}>
            <StepCaption step={1} text="Scroll to Payment QR Code section and upload your UPI QR image" />
          </Sequence>
          <Sequence from={80} durationInFrames={80}>
            <StepCaption text="The QR code will be displayed in the parent view for easy payments" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TemplatesScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Settings" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="5.4" title="Assessment Templates" />
          <Sequence from={10} durationInFrames={100}>
            <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
              {["School", "Security", "Templates"].map((tab, i) => (
                <div key={tab} style={{ padding: "10px 24px", fontSize: 14, fontWeight: i === 2 ? 600 : 400, color: i === 2 ? "#a5b4fc" : "rgba(255,255,255,0.5)", borderBottom: i === 2 ? "2px solid #6366f1" : "2px solid transparent", fontFamily: "sans-serif" }}>{tab}</div>
              ))}
            </div>
          </Sequence>

          <Sequence from={20} durationInFrames={400}>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <MockForm
                  title="Create Assessment Template"
                  fields={[
                    { label: "Template Name", value: "CBSE Standard" },
                    { label: "Grading Type", value: "Marks-based" },
                  ]}
                  buttonText="Create Template"
                  delay={0}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: 20,
                    opacity: interpolate(frame - 80, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                  }}
                >
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 12 }}>COMPONENTS</div>
                  <MockTable
                    headers={["Component", "Max Marks"]}
                    rows={[
                      ["Periodic Test", "20"],
                      ["Notebook Work", "10"],
                      ["Subject Enrichment", "10"],
                      ["SEE", "60"],
                    ]}
                    delay={20}
                  />
                </div>
              </div>
            </div>
          </Sequence>

          <Sequence from={0} durationInFrames={70}>
            <StepCaption step={1} text='Switch to Templates tab → click "+ New Template"' />
          </Sequence>
          <Sequence from={70} durationInFrames={80}>
            <StepCaption step={2} text="Define Name, Grading Type, and add Components with max marks" />
          </Sequence>
          <Sequence from={150} durationInFrames={80}>
            <StepCaption step={3} text="Add Grade Mappings (e.g., A1 = 91-100%) for the report card" />
          </Sequence>
          <Sequence from={230} durationInFrames={80}>
            <StepCaption step={4} text="Use Class Assignment to link template to specific classes per year" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Ch5Settings: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={0} durationInFrames={FPS * 4}>
        <ChapterTitle chapterNumber={5} title="Settings" subtitle="School profile, QR codes, passwords & templates" />
      </Sequence>
      <Sequence from={FPS * 4} durationInFrames={FPS * 55}>
        <SchoolProfileScene />
      </Sequence>
      <Sequence from={FPS * 59} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Payment QR Code →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 61} durationInFrames={FPS * 40}>
        <PaymentQRScene />
      </Sequence>
      <Sequence from={FPS * 101} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Assessment Templates →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 103} durationInFrames={FPS * 77}>
        <TemplatesScene />
      </Sequence>
    </AbsoluteFill>
  );
};
