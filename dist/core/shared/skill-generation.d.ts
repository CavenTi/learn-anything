import { getLearnTopicCommandTemplate, type SkillTemplate } from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';
export interface SkillTemplateEntry {
    template: SkillTemplate;
    dirName: string;
    workflowId: string;
}
export interface CommandTemplateEntry {
    template: ReturnType<typeof getLearnTopicCommandTemplate>;
    id: string;
}
export declare function getSkillTemplates(): SkillTemplateEntry[];
export declare function getCommandTemplates(): CommandTemplateEntry[];
export declare function getCommandContents(): CommandContent[];
export declare function generateSkillContent(template: SkillTemplate, generatedByVersion: string, transformInstructions?: (instructions: string) => string): string;
//# sourceMappingURL=skill-generation.d.ts.map