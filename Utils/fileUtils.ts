import { PathLike, readdirSync, statSync } from "fs";
import { join } from "path";

function getAllFilesInFolder(path: string): string[]{
    let filesInFolders: string[] = [];
    let files = readdirSync(path);
    for(const file of files){
        let isDir = statSync(join(path, file)).isDirectory();
        if(isDir){
            filesInFolders = filesInFolders.concat(getAllFilesInFolder(join(path, file)))
        }else{
            filesInFolders.push(join(path, file));
        }
    }
    return filesInFolders;
}

export default getAllFilesInFolder;