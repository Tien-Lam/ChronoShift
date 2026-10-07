import { ResizeSafePopover } from "./ResizeSafePopover";
import { useRef, useState } from "react";
import {
  Select,
  SelectValue,
  Button,
  ListBox,
  ListBoxItem,
  Text,
} from "react-aria-components/Select";
import { ComboBox, Input } from "react-aria-components/ComboBox";
import { Group } from "react-aria-components/Group";
import { cityAliases, resolveCity, zoneIds, zoneName } from "../engine/zones";
import { diagnostic } from "../platform/diagnostics";

type Option = { id: string; label: string; description?: string };
type ChoiceProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};
export function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function ChoiceItems({
  options,
  byValue = false,
}: {
  options: Option[];
  byValue?: boolean;
}) {
  return (
    <ListBox
      className="choice-list"
      items={options}
      // A suggestion appearing under the pointer must not become the value
      // committed by Tab. Arrow navigation and option presses still select.
      shouldFocusOnHover={byValue ? false : undefined}
      renderEmptyState={() => <div className="choice-empty">No matches</div>}
    >
      {(item) => (
        <ListBoxItem
          id={item.id}
          textValue={byValue ? item.id : item.label}
          data-value={item.id}
          className="choice-item"
        >
          <div className="choice-item-text">
            <Text slot="label">{item.label}</Text>
            {item.description && (
              <Text slot="description">{item.description}</Text>
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
        </ListBoxItem>
      )}
    </ListBox>
  );
}
export function ChoiceSelect({
  id,
  label,
  value,
  onChange,
  options,
  describedBy,
}: ChoiceProps & { options: Option[]; describedBy?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Select
      className="choice-select"
      isOpen={open}
      onOpenChange={setOpen}
      aria-label={label}
      aria-describedby={describedBy}
      value={value}
      onChange={(key) => {
        if (key !== null) onChange(String(key));
      }}
    >
      <Button
        id={id}
        aria-label={label}
        data-value={value}
        className="choice-trigger"
      >
        <SelectValue>
          {options.find((option) => option.id === value)?.label}
        </SelectValue>
        <Chevron />
      </Button>
      <ResizeSafePopover
        className="choice-popover"
        inert={!open}
        aria-hidden={!open}
        placement="bottom start"
        offset={8}
        containerPadding={12}
      >
        <ChoiceItems options={options} />
      </ResizeSafePopover>
    </Select>
  );
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replaceAll("_", " ")
    .trim();
const zoneLabels = new Set(zoneIds.map((zone) => normalize(zoneName(zone))));
const timezoneOptions: Option[] = [
  { id: "UTC", label: "UTC" },
  ...zoneIds
    .filter((zone) => zone !== "UTC")
    .map((zone) => ({ id: zone, label: zoneName(zone), description: zone })),
  ...cityAliases
    .filter((city) => !zoneLabels.has(normalize(city)))
    .map((city) => ({
      id: city,
      label:
        city.length <= 3
          ? city.toUpperCase()
          : city.replace(/\b\w/g, (c) => c.toUpperCase()),
      description: resolveCity(city).zones[0],
    })),
];
const searchText = new Map(
  timezoneOptions.map((option) => [
    option.id,
    normalize(`${option.id} ${option.label} ${option.description || ""}`),
  ]),
);
const optionIds = new Set(timezoneOptions.map((option) => option.id));

export function ZoneChoice({
  id,
  label,
  value,
  onChange,
  placeholder,
  describedBy,
  invalid,
  triggerLabel,
}: ChoiceProps & {
  placeholder: string;
  describedBy?: string;
  invalid?: boolean;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const current = useRef(value);
  current.current = value;
  const commit = (next: string) => {
    if (next !== current.current) {
      current.current = next;
      onChange(next);
    }
  };
  return (
    <ComboBox
      className="choice-combo"
      onOpenChange={setOpen}
      aria-label={label}
      inputValue={value}
      onInputChange={commit}
      value={optionIds.has(value) ? value : null}
      onChange={(key) => {
        if (key !== null) commit(String(key));
      }}
      defaultItems={timezoneOptions}
      defaultFilter={(text, query) =>
        (searchText.get(text) || normalize(text)).includes(normalize(query))
      }
      allowsCustomValue
      allowsEmptyCollection
      isInvalid={invalid}
      validationBehavior="aria"
    >
      <Group className="choice-control">
        <Input
          id={id}
          placeholder={placeholder}
          aria-describedby={describedBy}
          autoComplete="off"
          onFocus={() =>
            diagnostic("ui.zone-focus", {
              field: id === "target-zone" ? "target-zone" : "source-zone",
            })
          }
        />
        <Button
          className="choice-toggle"
          aria-label={triggerLabel}
          onPress={() =>
            diagnostic("ui.zone-open", {
              field: id === "target-zone" ? "target-zone" : "source-zone",
            })
          }
        >
          <Chevron />
        </Button>
      </Group>
      <ResizeSafePopover
        className="choice-popover"
        inert={!open}
        aria-hidden={!open}
        placement="bottom start"
        offset={8}
        containerPadding={12}
        isNonModal
      >
        <ChoiceItems options={timezoneOptions} byValue />
      </ResizeSafePopover>
    </ComboBox>
  );
}
