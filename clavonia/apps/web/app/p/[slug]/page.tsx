import type { Block, BrandTheme } from "@clavonia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findPublishedPage } from "../../../lib/projects";

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = findPublishedPage(slug);
  return { title: found ? found.page.title : "Página no encontrada" };
}

function readString(props: Record<string, unknown>, key: string): string | undefined {
  const value = props[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function BlockView({ block, brand }: { block: Block; brand: BrandTheme }) {
  // TODO: sustituir por el renderizador de bloques de @clavonia/editor.
  const title = readString(block.props, "title") ?? readString(block.props, "headline");
  const body = readString(block.props, "body") ?? readString(block.props, "text");
  if (!title && !body) return null;

  return (
    <section className="px-4 py-10 md:px-8">
      {title && (
        <h2
          className="text-3xl font-semibold"
          style={{ fontFamily: brand.headingFont, color: brand.primary }}
        >
          {title}
        </h2>
      )}
      {body && <p className="mt-4 leading-relaxed">{body}</p>}
    </section>
  );
}

export default async function PublishedPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const found = findPublishedPage(slug);
  if (!found) notFound();

  const { project, page } = found;
  const brand = project.brand;

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: brand.background, color: brand.text, fontFamily: brand.bodyFont }}
    >
      {page.blocks.map((block) => (
        <BlockView key={block.id} block={block} brand={brand} />
      ))}
    </main>
  );
}
