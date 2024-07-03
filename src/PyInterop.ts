import { ServerAPI, ServerResponse } from "decky-frontend-lib";
import { Shortcut } from "./lib/data-structures/Shortcut";

type ShortcutsDictionary = {
  [key: string]: Shortcut
}

/**
 * Class for frontend - backend communication.
 */
export class PyInterop {
  private static serverAPI: ServerAPI;

  /**
   * Sets the interop's severAPI.
   * @param serv The ServerAPI for the interop to use.
   */
  static setServer(serv: ServerAPI): void {
    this.serverAPI = serv;
  }

  /**
   * Gets the interop's serverAPI.
   */
  static get server(): ServerAPI { return this.serverAPI; }

  /**
   * Logs a message to bash shortcut's log file and the frontend console.
   * @param message The message to log.
   */
  static async log(message: string): Promise<void> {
    console.log(`[BashShortcuts] ${message}`);
    try {
      await this.serverAPI.callPluginMethod<{ message: string }, boolean>("logMessage", { message: `[front-end]: ${message}` });
    } catch (error) {
      console.error("[BashShortcuts] Failed to log message", error);
    }
  }

  /**
   * Gets a user's home directory.
   * @returns A promise resolving to a server response containing the user's home directory.
   */
  static async getHomeDir(): Promise<ServerResponse<string>> {
    try {
      const res = await this.serverAPI.callPluginMethod<{}, string>("getHomeDir", {});
      await this.log(`Home directory retrieved: ${JSON.stringify(res)}`);
      return res;
    } catch (error) {
      await this.log(`Failed to get home directory: ${error}`);
      throw error;
    }
  }

  /**
   * Shows a toast message.
   * @param title The title of the toast.
   * @param message The message of the toast.
   */
  static toast(title: string, message: string): void {
    try {
      this.serverAPI.toaster.toast({
        title: title,
        body: message,
        duration: 8000,
      });
      this.log(`Toast message shown: ${title} - ${message}`);
    } catch (e) {
      this.log(`Toaster Error: ${e}`);
    }
  }

  /**
   * Gets the shortcuts from the backend.
   * @returns A promise resolving to a server response containing the shortcuts dictionary.
   */
  static async getShortcuts(): Promise<ServerResponse<ShortcutsDictionary>> {
    try {
      const res = await this.serverAPI.callPluginMethod<{}, ShortcutsDictionary>("getShortcuts", {});
      await this.log(`Shortcuts retrieved: ${JSON.stringify(res)}`);
      return res;
    } catch (error) {
      await this.log(`Failed to get shortcuts: ${error}`);
      throw error;
    }
  }

  /**
   * Gets the plugin's guides.
   * @returns The guides.
   */
  static async getGuides(): Promise<ServerResponse<GuidePages>> {
    try {
      const res = await this.serverAPI.callPluginMethod<{}, GuidePages>("getGuides", {});
      await this.log(`Guides retrieved: ${JSON.stringify(res)}`);
      return res;
    } catch (error) {
      await this.log(`Failed to get guides: ${error}`);
      throw error;
    }
  }

  /**
   * Gets the value of a plugin's setting.
   * @param key The key of the setting to get.
   * @param defaultVal The default value of the setting.
   * @returns A promise resolving to the setting's value.
   */
  static async getSetting<T>(key: string, defaultVal: T): Promise<T> {
    try {
      const res = await this.serverAPI.callPluginMethod<{ key: string, defaultVal: T }, T>("getSetting", { key: key, defaultVal: defaultVal });
      await this.log(`Setting retrieved: ${JSON.stringify(res)}`);
      return res.result as T;
    } catch (error) {
      await this.log(`Failed to get setting: ${error}`);
      throw error;
    }
  }

  /**
   * Sets the value of a plugin's setting.
   * @param key The key of the setting to set.
   * @param newVal The new value for the setting.
   * @returns A void promise resolving once the setting is set.
   */
  static async setSetting<T>(key: string, newVal: T): Promise<ServerResponse<void>> {
    try {
      const res = await this.serverAPI.callPluginMethod<{ key: string, newVal: T }, void>("setSetting", { key: key, newVal: newVal });
      await this.log(`Setting set: ${JSON.stringify(res)}`);
      return res;
    } catch (error) {
      await this.log(`Failed to set setting: ${error}`);
      throw error;
    }
  }

  /**
   * Adds a new shortcut on the backend and returns the updated shortcuts dictionary.
   * @param shortcut The shortcut to add.
   * @returns A promise resolving to a server response containing the updated shortcuts dictionary.
   */
  static async addShortcut(shortcut: Shortcut): Promise<ServerResponse<ShortcutsDictionary>> {
    try {
      const res = await this.serverAPI.callPluginMethod<{ shortcut: Shortcut }, ShortcutsDictionary>("addShortcut", { shortcut: shortcut });
      await this.log(`Shortcut added: ${JSON.stringify(res)}`);
      return res;
    } catch (error) {
      await this.log(`Failed to add shortcut: ${error}`);
      throw error;
    }
  }

  /**
   * Sets the entire shortcuts dictionary, and returns the updated dictionary.
   * @param shortcuts The updated shortcuts dictionary.
   * @returns A promise resolving to a server response containing the updated shortcuts dictionary.
   */
  static async setShortcuts(shortcuts: ShortcutsDictionary): Promise<ServerResponse<ShortcutsDictionary>> {
    try {
      const res = await this.serverAPI.callPluginMethod<{ shortcuts: ShortcutsDictionary }, ShortcutsDictionary>("setShortcuts", { shortcuts: shortcuts });
      await this.log(`Shortcuts set: ${JSON.stringify(res)}`);
      return res;
    } catch (error) {
      await this.log(`Failed to set shortcuts: ${error}`);
      throw error;
    }
  }

  /**
   * Updates/edits a shortcut on the backend, and returns the updated dictionary.
   * @param shortcut The shortcut to update.
   * @returns A promise resolving to a server response containing the updated shortcuts dictionary.
   */
  static async modShortcut(shortcut: Shortcut): Promise<ServerResponse<ShortcutsDictionary>> {
    try {
      const res = await this.serverAPI.callPluginMethod<{ shortcut: Shortcut }, ShortcutsDictionary>("modShortcut", { shortcut: shortcut });
      await this.log(`Shortcut modified: ${JSON.stringify(res)}`);
      return res;
    } catch (error) {
      await this.log(`Failed to modify shortcut: ${error}`);
      throw error;
    }
  }

  /**
   * Removes a shortcut on the backend and returns the updated shortcuts dictionary.
   * @param shortcut The shortcut to remove.
   * @returns A promise resolving to a server response containing the updated shortcuts dictionary.
   */
  static async remShortcut(shortcut: Shortcut): Promise<ServerResponse<ShortcutsDictionary>> {
    return await this.serverAPI.callPluginMethod<{ shortcut: Shortcut }, ShortcutsDictionary>("remShortcut", { shortcut: shortcut });
  }

  /**
   * Runs a non app shortcut.
   * @param shortcutId The id of the shortcut to run.
   * @param flags Optional tuple array of flags to pass to the shortcut.
   */
  static async runNonAppShortcut(shortcutId: string, flags: [string, string][]): Promise<ServerResponse<void>> {
    const successful = await this.serverAPI.callPluginMethod<{ shortcutId: string, flags: [string, string][] }, void>("runNonAppShortcut", { shortcutId: shortcutId, flags: flags });
    return successful;
  }

  /**
   * Kills a non app shortcut.
   * @param shortcutId The id of the shortcut to kill.
   */
  static async killNonAppShortcut(shortcutId: string): Promise<ServerResponse<void>> {
    const successful = await this.serverAPI.callPluginMethod<{ shortcutId: string }, void>("killNonAppShortcut", { shortcutId: shortcutId });
    return successful;
  }
}