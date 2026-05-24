import { promises as fs } from 'fs';
import path from 'path';
export class FileSystemUtils {
    static async ensureDir(dirPath) {
        await fs.mkdir(dirPath, { recursive: true });
    }
    static async writeFile(filePath, content) {
        await FileSystemUtils.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, content, 'utf-8');
    }
    static async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    static async dirExists(dirPath) {
        try {
            const stat = await fs.stat(dirPath);
            return stat.isDirectory();
        }
        catch {
            return false;
        }
    }
    static async removeDir(dirPath) {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
        }
        catch {
            // Ignore if directory doesn't exist
        }
    }
}
//# sourceMappingURL=file-system.js.map