import { Event, WorkspaceFolder, WorkspaceFoldersChangeEvent } from 'vscode-languageserver-protocol';
import { Feature, _RemoteWorkspace } from './main';
export interface WorkspaceFolders {
    getWorkspaceFolders(): Thenable<WorkspaceFolder[] | null>;
    onDidChangeWorkspaceFolders: Event<WorkspaceFoldersChangeEvent>;
}
export declare const WorkspaceFoldersFeature: Feature<_RemoteWorkspace, WorkspaceFolders>;
