import path from 'path';
function escapeYamlValue(value) {
    const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
    if (needsQuoting) {
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        return `"${escaped}"`;
    }
    return value;
}
function formatTagsArray(tags) {
    const escapedTags = tags.map((tag) => escapeYamlValue(tag));
    return `[${escapedTags.join(', ')}]`;
}
export const claudeAdapter = {
    toolId: 'claude',
    getFilePath(commandId) {
        return path.join('.claude', 'commands', 'learn', `${commandId}.md`);
    },
    formatFile(content) {
        return `---
name: ${escapeYamlValue(content.name)}
description: ${escapeYamlValue(content.description)}
category: ${escapeYamlValue(content.category)}
tags: ${formatTagsArray(content.tags)}
---

${content.body}
`;
    },
};
//# sourceMappingURL=claude.js.map