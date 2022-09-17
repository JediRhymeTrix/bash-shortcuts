import { ServerAPI, ServerResponse } from "decky-frontend-lib";
import { v4 as uuidv4 } from 'uuid';
import { Shortcut } from "./Shortcut";

type ShortcutsDictionary = {
    [key:string]: Shortcut
}

interface launchAppArgs {
    name:string,
    cmd: string
}

export class PyInterop {
    private static serverAPI:ServerAPI;

    static setServer(serv:ServerAPI) {
        this.serverAPI = serv;
    }

    static get server() {
        return this.serverAPI;
    }

    static async getShortcuts(): Promise<ServerResponse<ShortcutsDictionary>> {
        return await this.serverAPI.callPluginMethod<{}, ShortcutsDictionary>("getShortcuts", {});
    }
    static async addShortcut(shortcut:Shortcut): Promise<ServerResponse<ShortcutsDictionary>> {
        return await this.serverAPI.callPluginMethod<{shortcut:Shortcut}, ShortcutsDictionary>("addShortcuts", { shortcut: shortcut });
    }
    static async modShortcut(shortcut:Shortcut): Promise<ServerResponse<ShortcutsDictionary>> {
        return await this.serverAPI.callPluginMethod<{shortcut:Shortcut}, ShortcutsDictionary>("modShortcuts", { shortcut: shortcut });
    }
    static async remShortcut(shortcut:Shortcut): Promise<ServerResponse<ShortcutsDictionary>> {
        return await this.serverAPI.callPluginMethod<{shortcut:Shortcut}, ShortcutsDictionary>("remShortcuts", { shortcut: shortcut });
    }


    static async launchApp(name:string, cmd:string): Promise<void> {
        await this.serverAPI.callPluginMethod<launchAppArgs, void>("launchApp", { name: name, cmd: cmd });
    }
    static async getInstalledApps(): Promise<ServerResponse<Application[]>> {
        const apps = await this.serverAPI.callPluginMethod<{}, Application[]>("getInstalledApps", {});
        return apps;
    }
    static async addManualShortcut(path:string): Promise<ServerResponse<ShortcutsDictionary>> {
        const id = uuidv4();
        return await this.serverAPI.callPluginMethod<{ id:string, path: string }, ShortcutsDictionary>("addManualShortcut", { id: id, path: path });
    }
}