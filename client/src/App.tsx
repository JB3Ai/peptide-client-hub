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
  content: string[];
};
export type VaultDocument = {
  id: string;
  name: string;
  type: string;
  room: string;
  size: string;
  filename: string;
  url: string;
  /** Present for videos hosted on YouTube instead of a local file; drives the embed + "Watch" link. */
  youtubeId?: string;
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
    content: [
      "Every workstream in this hub answers to a single spine: a clear proposition, a defined audience, and an operating model that can actually be run day to day. Before a single peptide is sourced or a single ad is booked, the business plan sets out why this venture exists, who it serves first, and what it takes to keep a promise of quality and consistency in a category built on trust.",
      "This is the room where assumptions get tested rather than repeated. It holds the decision log Georgie's team works from — the open questions, the calls already made, and the reasoning behind each one — so the plan stays a living document instead of a slide deck nobody revisits after launch.",
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
    content: [
      "Peptides sell on trust before they sell on price, so the marketing plan starts with education, not discounting. The 90-day workbook sequences organic content, paid support, and partner activity so that by the time a prospect sees a price, they already understand what they're buying and why it's worth it.",
      "Short-form video carries the education load — the TikTok and Instagram blueprint is built for South African audiences discovering peptides for the first time, with hooks, pillars, and a consistent call-to-action system so every post moves someone one step closer to a qualified conversation with the team.",
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
    content: [
      "Supplier qualification is the room where the whole venture is either won or lost quietly, long before a customer ever sees a product. This workstream tracks every Asian manufacturer and laboratory considered, the evidence gathered for each one, and the status of every request for information sent out.",
      "Nothing moves from \"under review\" to \"approved\" without a documented reason. The tracker records audits requested, certificates verified, and the suppliers that were deliberately excluded — because the paper trail that keeps a due-diligence process defensible is exactly the paper trail that keeps customers safe.",
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
    content: [
      "Peptides live and die on the cold chain, so delivery is treated as part of the product, not a courier's problem. This workstream sets the 2–8°C handoff standard from the moment stock leaves a supplier to the moment it reaches a customer's door, including the pilot route used to prove the standard actually holds under real conditions.",
      "Every shipment is logged, and every temperature exception has a named owner and a resolution path — not a shrug. Stock counts, fulfilment timing, and arrival checks close the loop so the team knows, batch by batch, that what left the warehouse is what arrived.",
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
    content: [
      "The catalogue is organised around how a real customer actually thinks about peptides, not how a lab organises a molecule list. Four live lanes group products by the job they do — a daily recovery ritual, a structured performance protocol, everyday convenience, and a premium longevity tier — so the range makes sense on a shelf and in a conversation.",
      "Every product in the library carries the same questions attached: what proof exists for it, what format it ships in, and where it fits against demand already seen in the market. That keeps the catalogue a working tool for decisions, not a static list of SKUs.",
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
    content: [
      "Nothing in this hub is a guess. The research room holds the global top 25 peptides by demand, the product news shaping 2025–2026, and a ground-level demand assessment built specifically for the South African market using public, real-world data rather than assumption.",
      "Every figure and recommendation traces back to a source in the register, with the methodology documented alongside it. That means any claim used in marketing, pricing, or supplier conversations can be checked, defended, and updated as new data comes in — the discipline that keeps the whole venture honest.",
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
    content: [
      "Five distinct identity territories were developed so Georgie can compare real options side by side rather than choose blind: Quiet Lab, Signal House, and Modern Apothecary sit at one end of the spectrum, with Future Classic and Black Label offering bolder, more premium directions.",
      "Each territory comes with its own name logic, colour system, typography, and packaging language, worked through on label and box mockups so the choice can be made against something tangible. This is the room that decides what the brand looks like the moment it's picked up off a shelf.",
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
    content: [
      "The website is designed as an experience, not a brochure: education first, proof within easy reach, and a capture point placed at exactly the moment a visitor's intent peaks. Annotated wireframes map every route through the site, from first landing to the questions a genuinely curious buyer would ask next.",
      "Every page is built to answer a question before the visitor has to ask a human, then hand qualified interest straight into the CRM with the right next action attached — so the site does real work in the funnel instead of sitting there as a digital business card.",
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
    content: [
      "The financial model exists to answer one question honestly: what does it actually cost to do this properly, at each stage of growth? Three scenarios — minimum viable, funded pilot, and scale — set out the spend, stock, and headcount needed to run credibly at each size, rather than a single optimistic number.",
      "A six-month forecast turns those envelopes into a working budget, with the funding gates and unit economics that determine whether the pilot should scale, hold, or change direction laid out as decisions rather than hopes. This is the room that keeps ambition tied to arithmetic.",
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
    content: [
      "The vault is the evidence behind every claim made in this hub — every PDF, workbook, tracker, and recording that a decision was actually based on.",
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
    content: [
      "Nothing stays open without an owner — every question raised across the workstreams above lands here until it's resolved.",
    ],
  },
];
export default function App() {
  return <Workspace modules={modules} documents={vaultDocuments} />;
}
