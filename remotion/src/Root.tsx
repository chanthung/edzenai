import { Composition } from "remotion";
import { Ch1Students } from "./chapters/Ch1Students";
import { Ch2AcademicYears } from "./chapters/Ch2AcademicYears";
import { Ch3FeeSetup } from "./chapters/Ch3FeeSetup";
import { Ch4Teachers } from "./chapters/Ch4Teachers";
import { Ch5Settings } from "./chapters/Ch5Settings";
import { Ch6Progress } from "./chapters/Ch6Progress";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ch1-students" component={Ch1Students} durationInFrames={FPS * 210} fps={FPS} width={1920} height={1080} />
      <Composition id="ch2-academic-years" component={Ch2AcademicYears} durationInFrames={FPS * 180} fps={FPS} width={1920} height={1080} />
      <Composition id="ch3-fee-setup" component={Ch3FeeSetup} durationInFrames={FPS * 210} fps={FPS} width={1920} height={1080} />
      <Composition id="ch4-teachers" component={Ch4Teachers} durationInFrames={FPS * 180} fps={FPS} width={1920} height={1080} />
      <Composition id="ch5-settings" component={Ch5Settings} durationInFrames={FPS * 180} fps={FPS} width={1920} height={1080} />
      <Composition id="ch6-progress" component={Ch6Progress} durationInFrames={FPS * 240} fps={FPS} width={1920} height={1080} />
    </>
  );
};
