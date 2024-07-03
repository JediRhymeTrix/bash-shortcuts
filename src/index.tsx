import {
  ButtonItem,
  definePlugin,
  gamepadDialogClasses,
  Navigation,
  PanelSection,
  PanelSectionRow,
  quickAccessControlsClasses,
  ServerAPI,
  ServerResponse,
  SidebarNavigation,
  staticClasses,
} from "decky-frontend-lib";
import { VFC, Fragment, useRef } from "react";
import { IoApps, IoSettingsSharp } from "react-icons/io5";
import { HiViewGridAdd } from "react-icons/hi";
import { FaEdit } from "react-icons/fa";
import { MdNumbers } from "react-icons/md";
import { AddShortcut } from "./components/plugin-config-ui/AddShortcut";
import { ShortcutLauncher } from "./components/ShortcutLauncher";
import { ManageShortcuts } from "./components/plugin-config-ui/ManageShortcuts";

import { PyInterop } from "./PyInterop";
import { Shortcut } from "./lib/data-structures/Shortcut";
import { ShortcutsContextProvider, ShortcutsState, useShortcutsState } from "./state/ShortcutsState";
import { PluginController } from "./lib/controllers/PluginController";
import { Settings } from "./components/plugin-config-ui/Settings";
import { GuidePage } from "./components/plugin-config-ui/guides/GuidePage";

declare global {
  var SteamClient: SteamClient;
  var collectionStore: CollectionStore;
  var appStore: AppStore;
  var loginStore: LoginStore;
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({ }) => {
  const { shortcuts, setShortcuts, shortcutsList } = useShortcutsState();
  const tries = useRef(0);

  console.log("[BashShortcuts] Content component rendered");
  console.log("[BashShortcuts] useShortcutsState returned", { shortcuts, setShortcuts, shortcutsList });

  async function reload(): Promise<void> {
    console.log("[BashShortcuts] Reloading shortcuts");
    try {
      const res = await PyInterop.getShortcuts();
      if (res && res.result) {
        console.log("[BashShortcuts] Shortcuts reloaded", res.result);
        if (setShortcuts) {
          setShortcuts(res.result as ShortcutsDictionary);
          console.log("[BashShortcuts] setShortcuts called successfully");
        } else {
          console.error("[BashShortcuts] setShortcuts is undefined");
        }
      } else {
        console.error("[BashShortcuts] Failed to reload shortcuts: Invalid response", res);
      }
    } catch (error) {
      console.error("[BashShortcuts] Failed to reload shortcuts", error);
    }
  }

  if (Object.values(shortcuts as ShortcutsDictionary).length === 0 && tries.current < 10) {
    console.log("[BashShortcuts] No shortcuts found, reloading...");
    reload();
    tries.current++;
  }

  return (
    <>
      <style>{`
        .bash-shortcuts-scope {
          width: inherit;
          height: inherit;
          flex: 1 1 1px;
          scroll-padding: 48px 0px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-content: stretch;
        }
        .bash-shortcuts-scope .${quickAccessControlsClasses.PanelSection} {
          padding: 0px;
        }

        .bash-shortcuts-scope .${gamepadDialogClasses.FieldChildren} {
          margin: 0px 16px;
        }
        
        .bash-shortcuts-scope .${gamepadDialogClasses.FieldLabel} {
          margin-left: 16px;
        }
      `}</style>
      <div className="bash-shortcuts-scope">
        <PanelSection>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => {
              console.log("[BashShortcuts] Navigating to Plugin Config");
              Navigation.CloseSideMenus();
              Navigation.Navigate("/bash-shortcuts-config");
            }} >
              Plugin Config
            </ButtonItem>
          </PanelSectionRow>
          {
            (shortcutsList.length == 0) ? (
              <div style={{ textAlign: "center", margin: "14px 0px", padding: "0px 15px", fontSize: "18px" }}>No shortcuts found</div>
            ) : (
              <>
                {
                  shortcutsList.map((itm: Shortcut) => (
                    <ShortcutLauncher key={itm.id} shortcut={itm} />
                  ))
                }
                <PanelSectionRow>
                  <ButtonItem layout="below" onClick={reload} >
                    Reload
                  </ButtonItem>
                </PanelSectionRow>
              </>
            )
          }
        </PanelSection>
      </div>
    </>
  );
};

const ShortcutsManagerRouter: VFC<{ guides: GuidePages }> = ({ guides }) => {
  console.log("[BashShortcuts] ShortcutsManagerRouter component rendered", guides);
  const guidePages = {}
  Object.entries(guides).map(([ guideName, guide ]) => {
    guidePages[guideName] = {
      title: guideName,
      content: <GuidePage content={guide} />,
      route: `/bash-shortcuts-config/guides-${guideName.toLowerCase().replace(/ /g, "-")}`,
      icon: <MdNumbers />,
      hideTitle: true
    }
  });

  return (
    <SidebarNavigation
      title="Plugin Config"
      showTitle
      pages={[
        {
          title: "Add Shortcut",
          content: <AddShortcut />,
          route: "/bash-shortcuts-config/add",
          icon: <HiViewGridAdd />
        },
        {
          title: "Manage Shortcuts",
          content: <ManageShortcuts />,
          route: "/bash-shortcuts-config/manage",
          icon: <FaEdit />
        },
        {
          title: "Settings",
          content: <Settings />,
          route: "/bash-shortcuts-config/settings",
          icon: <IoSettingsSharp />
        },
        "separator",
        guidePages["Overview"],
        guidePages["Managing Shortcuts"],
        guidePages["Custom Scripts"],
        guidePages["Using Hooks"]
      ]}
    />
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  console.log("[BashShortcuts] Plugin defined");
  PyInterop.setServer(serverApi);

  const state = new ShortcutsState();
  PluginController.setup(serverApi, state);

  const loginHook = PluginController.initOnLogin();

  PyInterop.getGuides().then((res: ServerResponse<GuidePages>) => {
    const guides = res.result as GuidePages;
    console.log("[BashShortcuts] Guides loaded", guides);

    serverApi.routerHook.addRoute("/bash-shortcuts-config", () => (
      <ShortcutsContextProvider shortcutsStateClass={state}>
        <ShortcutsManagerRouter guides={guides} />
      </ShortcutsContextProvider>
    ));
  }).catch((error) => {
    console.error("[BashShortcuts] Failed to load guides", error);
  });

  return {
    title: <div className={staticClasses.Title}>Bash Shortcuts</div>,
    content: (
      <ShortcutsContextProvider shortcutsStateClass={state}>
        <Content serverAPI={serverApi} />
      </ShortcutsContextProvider>
    ),
    icon: <IoApps />,
    onDismount() {
      console.log("[BashShortcuts] Plugin dismounted");
      loginHook.unregister();
      serverApi.routerHook.removeRoute("/bash-shortcuts-config");
      PluginController.dismount();
    },
    alwaysRender: true
  };
});