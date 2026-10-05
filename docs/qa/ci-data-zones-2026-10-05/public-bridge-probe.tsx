import { useRef } from "react";
import type { Collection, Node } from "react-stately";
import { useComboBoxState } from "react-stately/useComboBoxState";
import { useComboBox } from "react-aria/useComboBox";
import { Button, ButtonContext } from "react-aria-components/Button";
import { Input, InputContext } from "react-aria-components/Input";
import { Group, GroupContext } from "react-aria-components/Group";
import { ListBox, ListBoxContext, ListStateContext } from "react-aria-components/ListBox";
import { Popover, PopoverContext } from "react-aria-components/Popover";
import { OverlayTriggerStateContext } from "react-aria-components/Dialog";

export function PublicBridge({ collection }: { collection: Collection<Node<unknown>> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const listBoxRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLElement>(null);
  const state = useComboBoxState({ collection, inputValue: "UTC", value: "UTC", allowsCustomValue: true, allowsEmptyCollection: true, validationBehavior: "aria" });
  const { inputProps, buttonProps, listBoxProps } = useComboBox({ inputRef, buttonRef, listBoxRef, popoverRef, "aria-label": "Timezone" }, state);
  return (
    <InputContext.Provider value={{ ...inputProps, ref: inputRef }}>
      <ButtonContext.Provider value={{ ...buttonProps, ref: buttonRef, isPressed: state.isOpen }}>
        <GroupContext.Provider value={{ ref: groupRef, isInvalid: false }}>
          <OverlayTriggerStateContext.Provider value={state}>
            <PopoverContext.Provider value={{ ref: popoverRef, triggerRef: groupRef, scrollRef: listBoxRef, isNonModal: true, trigger: "ComboBox", clearContexts: [InputContext, ButtonContext, GroupContext] }}>
              <ListBoxContext.Provider value={{ ...listBoxProps, ref: listBoxRef }}>
                <ListStateContext.Provider value={state}>
                  <Group><Input /><Button>Open</Button></Group>
                  <Popover><ListBox shouldFocusOnHover={false} /></Popover>
                </ListStateContext.Provider>
              </ListBoxContext.Provider>
            </PopoverContext.Provider>
          </OverlayTriggerStateContext.Provider>
        </GroupContext.Provider>
      </ButtonContext.Provider>
    </InputContext.Provider>
  );
}
