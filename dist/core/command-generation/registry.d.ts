import type { ToolCommandAdapter } from './types.js';
export declare class CommandAdapterRegistry {
    private static adapters;
    static get(toolId: string): ToolCommandAdapter | undefined;
    static has(toolId: string): boolean;
    static getAll(): ToolCommandAdapter[];
}
//# sourceMappingURL=registry.d.ts.map