import path from 'path';
import os from 'os';
function escapeYamlValue(value) {
    const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
    if (needsQuoting) {
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        return `"${escaped}"`;
    }
    return value;
}
export const codexAdapter = {
    toolId: 'codex',
    getFilePath(commandId) {
        return path.join(os.homedir(), '.codex', 'prompts', `learn-anything-${commandId}.md`);
    },
    formatFile(content) {
        return `---
description: ${escapeYamlValue(content.description)}
argument-hint: <概念名>
---

${content.body}
`;
    },
};
//# sourceMappingURL=codex.js.map