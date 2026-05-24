export declare class FileSystemUtils {
    static ensureDir(dirPath: string): Promise<void>;
    static writeFile(filePath: string, content: string): Promise<void>;
    static fileExists(filePath: string): Promise<boolean>;
    static dirExists(dirPath: string): Promise<boolean>;
    static removeDir(dirPath: string): Promise<void>;
}
//# sourceMappingURL=file-system.d.ts.map