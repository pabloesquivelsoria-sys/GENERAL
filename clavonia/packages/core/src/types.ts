export const BLOCK_TYPES = ['hero','about','services','gallery','testimonials','pricing','contact','cta','footer','text','image'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
export interface Block { id: string; type: BlockType; props: Record<string, unknown>; }
export interface BrandTheme { primary: string; secondary: string; background: string; text: string; headingFont: string; bodyFont: string; } // hex colors like #40273B
export interface PageDocument { id: string; slug: string; title: string; blocks: Block[]; }
export const PROJECT_KINDS = ['landing','website'] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];
export interface Project { id: string; name: string; kind: ProjectKind; ownerId: string; brand: BrandTheme; pages: PageDocument[]; status: 'draft' | 'published'; createdAt: string; updatedAt: string; }
