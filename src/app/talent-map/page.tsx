import { Metadata } from "next";
import { TalentMap } from "@/components/talent/TalentMap";

export const metadata: Metadata = {
  title: "Talent Map & Expert Skill Search | Project Atlas",
  description:
    "AI-powered organizational talent map. Extract employee skills from work descriptions and match subject matter experts using vector cosine similarity.",
};

export default function TalentMapPage() {
  return (
    <div className="py-2">
      <TalentMap />
    </div>
  );
}
