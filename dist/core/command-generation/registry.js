import { claudeAdapter, cursorAdapter, codexAdapter, geminiAdapter, } from './adapters/index.js';
export class CommandAdapterRegistry {
    static adapters = new Map();
    static {
        const all = [claudeAdapter, cursorAdapter, codexAdapter, geminiAdapter];
        for (const adapter of all) {
            CommandAdapterRegistry.adapters.set(adapter.toolId, adapter);
        }
    }
    static get(toolId) {
        return CommandAdapterRegistry.adapters.get(toolId);
    }
    static has(toolId) {
        return CommandAdapterRegistry.adapters.has(toolId);
    }
    static getAll() {
        return Array.from(CommandAdapterRegistry.adapters.values());
    }
}
//# sourceMappingURL=registry.js.map