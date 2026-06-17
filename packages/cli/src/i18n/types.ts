export type SupportedLocale = 'zh-CN' | 'en';

export interface ServeMessages {
  commandDescription: string;
  generatingSiteFiles: string;
  installingDependencies: string;
  startingDevServer: string;
  siteReady: (url: string) => string;
  npmNotFound: string;
  installFailed: (detail: string) => string;
  portInUse: (port: number) => string;
  noLearnDir: string;
  emptyTopics: string;
  serverStopped: string;
  siteGenerated: string;
}

export interface CLIMessages {
  programDescription: string;
  initCommandDescription: string;
  updateCommandDescription: string;
  toolsOptionDescription: (ids: string) => string;
  notDirectory: (path: string) => string;
  dirNotExist: (path: string) => string;
  cannotAccess: (path: string, msg: string) => string;
  errorPrefix: (msg: string) => string;
  updateComplete: string;
  forceOption: string;
  langOption: string;
  siteOption: string;
  portOption: string;
  noOpenOption: string;
  serveCommandDescription: string;
}

export interface InitMessages {
  header: string;
  noToolsSelected: string;
  availableTools: (tools: string) => string;
  skillGenerated: (toolName: string) => string;
  initComplete: string;
  globalDataPath: (dir: string) => string;
  startLearning: (example: string) => string;
  availableCommands: string;
  cmdLine: (cmd: string, desc: string) => string;
  interactiveSelectPrompt: string;
  migrationComplete: (count: number) => string;
  context7Prompt: string;
  context7Enabled: string;
  context7SetupHint: string;
}

export interface LocaleMessages {
  cli: CLIMessages;
  init: InitMessages;
  serve: ServeMessages;
}
