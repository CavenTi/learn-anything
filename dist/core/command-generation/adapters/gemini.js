import path from 'path';
function escapeYamlValue(value) {
    const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
    if (needsQuoting) {
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        return `"${escaped}"`;
    }
    return value;
}
export const geminiAdapter = {
    toolId: 'gemini',
    getFilePath(commandId) {
        return path.join('.gemini', 'commands', 'learn', `${commandId}.toml`);
    },
    formatFile(content) {
        return `description = "${escapeYamlValue(content.description)}"
prompt = """
${content.body}
"""
`;
    },
};
//# sourceMappingURL=gemini.js.map