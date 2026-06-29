import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolById, getAllToolIds } from "@/lib/tools/registry";
import ToolPageClient from "./ToolPageClient";

interface Props {
  params: Promise<{ toolId: string }>;
}

export async function generateStaticParams() {
  return getAllToolIds().map((toolId) => ({ toolId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolId } = await params;
  const tool = getToolById(toolId);
  if (!tool) return {};
  return {
    title: `${tool.name} — Free Online Tool | EveryFileConvert`,
    description: tool.longDesc,
  };
}

export default async function ToolPage({ params }: Props) {
  const { toolId } = await params;
  const tool = getToolById(toolId);
  if (!tool) notFound();
  return <ToolPageClient toolId={toolId} />;
}
