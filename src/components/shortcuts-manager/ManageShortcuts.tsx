import { ButtonItem, ConfirmModal, DialogButton, ReorderableEntry, ReorderableList, showModal } from "decky-frontend-lib";
import { Fragment, VFC, useRef } from "react";
import { PyInterop } from "../../PyInterop";
import { Shortcut } from "../../lib/data-structures/Shortcut";

import { EditModal } from "./EditModal";
import { useShortcutsState } from "../../state/ShortcutsState";
import { Menu, MenuItem, showContextMenu } from "./MenuProxy";
import { FaEllipsisH } from "react-icons/fa"

type ActionButtonProps<T> = {
  entry: ReorderableEntry<T>
}

/**
 * Component for reorderable list actions.
 * @param props The props for this ActionButton.
 * @returns An ActionButton component.
 */
const ActionButtion: VFC<ActionButtonProps<Shortcut>> = (props:ActionButtonProps<Shortcut>) => {
  const { shortcuts, setShortcuts } = useShortcutsState();

  function onAction(entryReference: ReorderableEntry<Shortcut>): void {
    const shortcut = entryReference.data as Shortcut;
    showContextMenu(
      <Menu label="Actions">
        <MenuItem onSelected={() => {
          showModal(
            // @ts-ignore
            <EditModal onConfirm={(updated: Shortcut) => {
              PyInterop.modShortcut(updated);
              let shorts = shortcuts;
              shorts[shortcut.id] = updated;
              setShortcuts(shorts);
            }} shortcut={shortcut} />
          );
        }}>Edit</MenuItem>
        <MenuItem onSelected={() => {
          showModal(
            <ConfirmModal onOK={() => {
              PyInterop.remShortcut(shortcut);
              let shorts = shortcuts;
              delete shorts[shortcut.id];
              setShortcuts(shorts);
            }} bDestructiveWarning={true}>
              Are you sure you want to delete this shortcut?
            </ConfirmModal>
          );
        }}>Delete</MenuItem>
      </Menu>,
      window
    );
  }

  return (
    <DialogButton style={{ height: "40px", minWidth: "40px", width: "40px", display: "flex", justifyContent: "center", alignItems: "center", padding: "10px" }} onClick={() => onAction(props.entry)} onOKButton={() => onAction(props.entry)}>
      <FaEllipsisH />
    </DialogButton>
  );
}

type InteractablesProps<T> = {
  entry: ReorderableEntry<T>
}

const Interactables: VFC<InteractablesProps<Shortcut>> = (props:InteractablesProps<Shortcut>) => {
  return (
    <>
      <ActionButtion  entry={props.entry} />
    </>
  );
}

/**
 * Component for managing plugin shortcuts.
 * @returns A ManageShortcuts component.
 */
export const ManageShortcuts: VFC = () => {
  const { setShortcuts, shortcutsList, reorderableShortcuts } = useShortcutsState();
  const tries = useRef(0);

  async function reload() {
    await PyInterop.getShortcuts().then((res) => {
      setShortcuts(res.result as ShortcutsDictionary);
    });
  }

  function onSave(entries: ReorderableEntry<Shortcut>[]) {
    const data = {};

    for (const entry of entries) {
      data[entry.data!.id] = {...entry.data, "position": entry.position}
    }

    setShortcuts(data);
    
    PyInterop.log("Reordered shortcuts.");
    PyInterop.setShortcuts(shortcutsList);
  }

  if (shortcutsList.length === 0 && tries.current < 10) {
    reload();
    tries.current++;
  }

  return (
    <>
      <div style={{
        marginBottom: "5px"
      }}>Here you can re-order or remove existing shortcuts</div>
      {shortcutsList.length > 0 ? (
        <>
          <ReorderableList<Shortcut> entries={reorderableShortcuts} onSave={onSave} interactables={Interactables} />
          <ButtonItem layout="below" onClick={reload} >
            Reload Shortcuts
          </ButtonItem>
        </>
      ) : (
        <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", padding: "5px" }}>
          Loading...
        </div>
      )
      }
    </>
  );
}