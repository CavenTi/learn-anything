import path from 'path';
function escapeYamlValue(value) {
    const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
    if (needsQuoting) {
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        return `"${escaped}"`;
    }
    return value;
}
export const cursorAdapter = {
    toolId: 'cursor',
    getFilePath(commandId) {
        return path.join('.cursor', 'commands', `learn-anything-${commandId}.md`);
    },
    formatFile(content) {
        return `---
name: /learn-anything-${content.id}
id: learn-anything-${content.id}
category: ${escapeYamlValue(content.category)}
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
    },
};
//# sourceMappingURL=cursor.js.map