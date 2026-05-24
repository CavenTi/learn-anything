export const en = {
    cli: {
        programDescription: 'AI-powered recursive learning system with Socratic method and TDD practice',
        initCommandDescription: 'Initialize Learn Anything learning skills in the current project',
        updateCommandDescription: 'Update Learn Anything skill files to latest version',
        toolsOptionDescription: (ids) => `Specify AI tools (non-interactive mode). Use "all", "none", or comma-separated list: ${ids}`,
        notDirectory: (path) => `Path "${path}" is not a directory`,
        dirNotExist: (path) => `Directory "${path}" does not exist, it will be created automatically.`,
        cannotAccess: (path, msg) => `Cannot access path "${path}": ${msg}`,
        errorPrefix: (msg) => `Error: ${msg}`,
        updateComplete: 'Learn Anything skill files have been updated.',
        forceOption: 'Skip confirmation prompt',
        langOption: 'Display language: zh-CN or en (default: system locale)',
    },
    init: {
        header: '\n🧠 Learn Anything — AI-Powered Recursive Learning System\n',
        noToolsSelected: 'No AI tools selected. Use --tools option to specify, or select in interactive mode.',
        availableTools: (tools) => `Available tools: ${tools}`,
        skillGenerated: (toolName) => `  ✓ ${toolName} — 5 skill files generated`,
        initComplete: '🎉 Learn Anything initialization complete!\n',
        globalDataPath: (dir) => `  Learning data stored at ${dir}/`,
        startLearning: (example) => `  Run ${example} to start your first learning topic\n`,
        availableCommands: 'Available learning commands:',
        cmdLine: (cmd, desc) => `  ${cmd}${desc}`,
        interactiveSelectPrompt: 'Select AI tools to generate skills for (space to select, enter to confirm):',
    },
};
//# sourceMappingURL=en.js.map