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
import { ShortcutLauncher } from "./components/ShortcutLanucher";
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
  var appStore: any;
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({ }) => {
  const { shortcuts, setShortcuts, shortcutsList } = useShortcutsState();
  const tries = useRef(0);

  async function reload(): Promise<void> {
    await PyInterop.getShortcuts().then((res) => {
      setShortcuts(res.result as ShortcutsDictionary);
    });
  }

  if (Object.values(shortcuts as ShortcutsDictionary).length === 0 && tries.current < 10) {
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
            <ButtonItem layout="below" onClick={() => { Navigation.CloseSideMenus(); Navigation.Navigate("/bash-shortcuts-config"); }} >
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
                    <ShortcutLauncher shortcut={itm} />
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
        guidePages["Background Tasks"],
        guidePages["Using Hooks"]
      ]}
    />
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  PyInterop.setServer(serverApi);

  const state = new ShortcutsState();
  PluginController.setup(serverApi);

  const loginHook = PluginController.initOnLogin();

  PyInterop.getGuides().then((res: ServerResponse<GuidePages>) => {
    const guides = res.result as GuidePages;
    console.log("Guides:", guides);

    serverApi.routerHook.addRoute("/bash-shortcuts-config", () => (
      <ShortcutsContextProvider shortcutsStateClass={state}>
        <ShortcutsManagerRouter guides={guides} />
      </ShortcutsContextProvider>
    ));
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
      loginHook.unregister();
      serverApi.routerHook.removeRoute("/bash-shortcuts-config");
      PluginController.onDismount();
    },
    alwaysRender: true
  };
});
