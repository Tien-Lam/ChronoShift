import { useContext, useRef } from "react";
import type { Collection, Key, Node } from "react-stately";
import { useOption } from "react-aria/useListBox";
import { useHover } from "react-aria/useHover";
import { mergeProps } from "react-aria/mergeProps";
import { ListStateContext } from "react-aria-components/ListBox";
import { Text } from "react-aria-components/Text";

type ZoneOption = Readonly<{
  id: string;
  label: string;
  description?: string;
}>;

// The complete data collection exists before either field opens. Only its
// visible row renderer mounts hooks; it never needs a hidden JSX collection.
export class ZoneCollection implements Collection<Node<ZoneOption>> {
  private readonly nodes: readonly Node<ZoneOption>[];
  private readonly byKey: ReadonlyMap<Key, Node<ZoneOption>>;

  constructor(options: readonly ZoneOption[]) {
    this.nodes = Object.freeze(
      options.map((item, index) => {
        const option = Object.freeze({ ...item });
        const node: Node<ZoneOption> = {
          type: "item",
          key: option.id,
          value: option,
          level: 0,
          hasChildNodes: false,
          childNodes: Object.freeze([]),
          rendered: option.label,
          textValue: option.id,
          index,
          parentKey: null,
          prevKey: options[index - 1]?.id,
          nextKey: options[index + 1]?.id,
          props: Object.freeze({ "data-value": option.id }),
          render: () => <ZoneRow option={option} />,
        };
        return Object.freeze(node);
      }),
    );
    this.byKey = new Map(this.nodes.map((node) => [node.key, node]));
    Object.freeze(this);
  }

  [Symbol.iterator]() {
    return this.nodes[Symbol.iterator]();
  }

  get size() {
    return this.nodes.length;
  }

  getKeys() {
    return this.byKey.keys();
  }

  getItem(key: Key) {
    return this.byKey.get(key) ?? null;
  }

  at(index: number) {
    return this.nodes[index] ?? null;
  }

  getFirstKey() {
    return this.nodes[0]?.key ?? null;
  }

  getLastKey() {
    return this.nodes.at(-1)?.key ?? null;
  }

  getKeyBefore(key: Key) {
    return this.getItem(key)?.prevKey ?? null;
  }

  getKeyAfter(key: Key) {
    return this.getItem(key)?.nextKey ?? null;
  }

  getChildren() {
    return [];
  }
}

function ZoneRow({ option }: { option: ZoneOption }) {
  const state = useContext(ListStateContext);
  const ref = useRef<HTMLDivElement>(null);
  if (!state) throw new Error("Timezone row requires its list state");
  const {
    optionProps,
    labelProps,
    descriptionProps,
    isSelected,
    isDisabled,
    isFocused,
    isFocusVisible,
    isPressed,
    allowsSelection,
    hasAction,
  } = useOption({ key: option.id }, state, ref);
  const { hoverProps, isHovered } = useHover({
    isDisabled: !allowsSelection && !hasAction,
  });
  return (
    <div
      {...mergeProps(optionProps, hoverProps)}
      ref={ref}
      className="choice-item"
      data-rac=""
      data-value={option.id}
      data-selected={isSelected || undefined}
      data-disabled={isDisabled || undefined}
      data-hovered={isHovered || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-pressed={isPressed || undefined}
      data-selection-mode={
        state.selectionManager.selectionMode === "none"
          ? undefined
          : state.selectionManager.selectionMode
      }
    >
      <div className="choice-item-text">
        <Text {...labelProps} slot="label">
          {option.label}
        </Text>
        {option.description && (
          <Text {...descriptionProps} slot="description">
            {option.description}
          </Text>
        )}
      </div>
      <svg
        className="choice-check"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="m5 12 4 4L19 6" />
      </svg>
    </div>
  );
}
