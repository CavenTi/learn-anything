import type { SupportedLocale } from '../i18n/types.js';
type InitCommandOptions = {
    tools?: string;
    force?: boolean;
    locale?: SupportedLocale;
    update?: boolean;
};
export declare class InitCommand {
    private readonly toolsArg?;
    private readonly force;
    private readonly locale;
    private readonly isUpdate;
    constructor(options?: InitCommandOptions);
    execute(targetPath?: string): Promise<void>;
    private detectTools;
    private hasToolDir;
    private interactiveSelect;
    private generateSkillsForTool;
    private generateCommandsForTool;
}
export {};
//# sourceMappingURL=init.d.ts.map