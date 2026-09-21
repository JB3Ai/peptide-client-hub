import Workspace from "./Workspace";
import vaultDocuments from "./data/vaultDocuments.json";
import {
  BarChart3,
  Beaker,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Calculator,
  ClipboardCheck,
  Database,
  Layers3,
  Palette,
  ShieldCheck,
  Truck,
} from "lucide-react";

export type Module = {
  id: string;
  section: string;
  title: string;
  description: string;
  status: string;
  icon: typeof BookOpen;
  accent: string;
  bullets: string[];
};
export type VaultDocument = {
  id: string;
  name: string;
  type: string;
  room: string;
  size: string;
  filename: string;
  url: string;
};
const modules: Module[] = [
  {
    id: "business",
    section: "01",
    title: "Business plan",
    description:
      "The strategic spine: proposition, audience, offer, operating model, and the decisions that make the venture credible.",
    status: "In progress",
    icon: BriefcaseBusiness,
    accent: "brass",
    bullets: [
      "North-star proposition and operating model",
      "Audience segments and priority geographies",
      "Decision log for open assumptions",
    ],
  },
  {
    id: "marketing",
    section: "02",
    title: "Marketing plan",
    description:
      "A practical route from education to qualified demand across paid, owned, social, search, and partner channels.",
    status: "Mapped",
    icon: BarChart3,
    accent: "coral",
    bullets: [
      "90-day launch action workbook",
      "TikTok and Instagram education blueprint",
      "Copy hooks, content pillars, and CTA system",
    ],
  },
  {
    id: "procurement",
    section: "03",
    title: "Procurement & imports",
    description:
      "Supplier qualification, imports, documentation, and route controls for a defensible product pipeline.",
    status: "Evidence room",
    icon: ShieldCheck,
    accent: "emerald",
    bullets: [
      "Asian manufacturer qualification tracker",
      "Due diligence evidence pack and source register",
      "RFI, audit, and hold / exclude decisions",
    ],
  },
  {
    id: "transport",
    section: "04",
    title: "Transport & logistics",
    description:
      "Cold-chain and last-mile controls that make delivery part of the customer promise, not an afterthought.",
    status: "Control plan",
    icon: Truck,
    accent: "blue",
    bullets: [
      "2–8°C handoff and route pilot",
      "Temperature logging and exception ownership",
      "Stock, fulfilment, and arrival checks",
    ],
  },
  {
    id: "catalogue",
    section: "05",
    title: "Product catalogue",
    description:
      "A living product library for categories, format, proof load, market fit, and the questions each product must answer.",
    status: "4 live lanes",
    icon: Boxes,
    accent: "brass",
    bullets: [
      "Recovery / daily ritual",
      "Performance / protocol",
      "Longevity / premium",
    ],
  },
  {
    id: "research",
    section: "06",
    title: "Product research",
    description:
      "Scientific data, market trends, demand assessment, keyword signals, and the provenance behind each recommendation.",
    status: "Source linked",
    icon: Beaker,
    accent: "emerald",
    bullets: [
      "Global top 25 trends and product news",
      "South Africa demand assessment",
      "Research source log and methodology",
    ],
  },
  {
    id: "brand",
    section: "07",
    title: "Brand studio",
    description:
      "Names, logos, typeface, color systems, packaging cues, and live identity territories for Georgie to compare.",
    status: "5 territories",
    icon: Palette,
    accent: "coral",
    bullets: [
      "Quiet Lab, Signal House, Modern Apothecary",
      "Future Classic and Black Label",
      "Packaging and label direction boards",
    ],
  },
  {
    id: "digital",
    section: "08",
    title: "Website ideas",
    description:
      "The experience architecture: education before conversion, proof within reach, and capture at the moment of intent.",
    status: "Concept room",
    icon: Layers3,
    accent: "blue",
    bullets: [
      "Annotated wireframes and website routes",
      "FAQ and question-led education",
      "CRM capture and next-action routing",
    ],
  },
  {
    id: "finance",
    section: "09",
    title: "Financial model",
    description:
      "Budget, funding requirements, launch scenarios, demand ranges, and the financial questions to pressure-test next.",
    status: "Scenario ready",
    icon: Calculator,
    accent: "brass",
    bullets: [
      "Minimum, pilot, and scale envelopes",
      "Six-month budget forecast",
      "Funding gates and unit economics",
    ],
  },
  {
    id: "vault",
    section: "10",
    title: "Data vault",
    description:
      "A controlled index of working files, evidence, references, and decisions so the bible stays auditable as it grows.",
    status: "Protected",
    icon: Database,
    accent: "emerald",
    bullets: [
      "Source documents and working files",
      "Research provenance and evidence register",
      "Questions, answers, and decision history",
    ],
  },
  {
    id: "decisions",
    section: "11",
    title: "Questions & decisions",
    description:
      "The living record of what Georgie needs to answer, what has been agreed, and what still needs an owner.",
    status: "3 open",
    icon: ClipboardCheck,
    accent: "coral",
    bullets: [
      "Questions waiting for a decision",
      "Decision log with owner and due date",
      "Answers linked back to source documents",
    ],
  },
];
export default function App() {
  return <Workspace modules={modules} documents={vaultDocuments} />;
}
