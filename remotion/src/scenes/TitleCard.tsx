import { AbsoluteFill } from "remotion";
import { Background } from "../components/Background";
import { ChapterTitle } from "../components/ChapterTitle";

interface TitleCardProps {
  chapterNumber: number;
  title: string;
  subtitle: string;
}

export const TitleCard: React.FC<TitleCardProps> = ({ chapterNumber, title, subtitle }) => (
  <AbsoluteFill>
    <Background />
    <ChapterTitle chapterNumber={chapterNumber} title={title} subtitle={subtitle} />
  </AbsoluteFill>
);
