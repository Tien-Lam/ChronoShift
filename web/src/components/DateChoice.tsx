import { ResizeSafePopover } from "./ResizeSafePopover";
import { useContext, useEffect, useMemo, useState } from "react";
import { parseDate, toCalendar } from "@internationalized/date";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker,
  DateSegment,
  Group,
  Label,
  type DateSegmentProps,
} from "react-aria-components/DatePicker";
import { DateFieldStateContext } from "react-aria-components/DateField";
import { Dialog } from "react-aria-components/Dialog";
import { Heading } from "react-aria-components/Heading";
import "./DateChoice.css";

interface DateChoiceProps {
  id: string;
  label: string;
  value: string;
  describedBy?: string;
  onChange: (value: string) => void;
  onValidityChange?: (valid: boolean) => void;
}

function ReferenceDateSegment({
  segment,
  onValidityChange,
}: Pick<DateSegmentProps, "segment"> &
  Pick<DateChoiceProps, "onValidityChange">) {
  const state = useContext(DateFieldStateContext);
  const segments = state?.segments.filter((part) => part.isEditable) ?? [];
  const blank = segments.every((part) => part.isPlaceholder);
  const complete = segments.every((part) => !part.isPlaceholder);
  const committed = state?.value && toCalendar(state.value, state.calendar);
  const matchesCommitted = segments
    .filter((part) => ["year", "month", "day"].includes(part.type))
    .every(
      (part) =>
        committed &&
        part.value === committed[part.type as "year" | "month" | "day"],
    );
  const valid =
    (blank && !committed) ||
    (complete && !!committed && matchesCommitted && !state?.isInvalid);

  useEffect(() => {
    if (segment.type === "year") onValidityChange?.(valid);
  }, [onValidityChange, segment.type, valid]);

  return <DateSegment className="date-choice-segment" segment={segment} />;
}

export function DateChoice({
  id,
  label,
  value,
  describedBy,
  onChange,
  onValidityChange,
}: DateChoiceProps) {
  const date = useMemo(() => (value ? parseDate(value) : null), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputReset, setInputReset] = useState(0);

  function clearDate() {
    // Reset partial segments too, even when the committed value is already empty.
    setInputReset((version) => version + 1);
    setIsOpen(false);
    onValidityChange?.(true);
    onChange("");
  }

  return (
    <DatePicker
      className="date-choice"
      aria-describedby={describedBy}
      value={date}
      onChange={(nextDate) => onChange(nextDate?.toString() ?? "")}
      granularity="day"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <Label className="date-choice-label">{label}</Label>
      <Group id={id} className="date-choice-control">
        <DateInput key={inputReset} className="date-input choice-trigger">
          {(segment) => (
            <ReferenceDateSegment
              segment={segment}
              onValidityChange={onValidityChange}
            />
          )}
        </DateInput>
        {value && (
          <button
            className="date-choice-clear-button"
            type="button"
            aria-label="Clear reference date"
            onClick={clearDate}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path d="m6 6 8 8M14 6l-8 8" />
            </svg>
          </button>
        )}
        <Button
          className="date-choice-calendar-button"
          aria-label="Choose reference date"
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <rect x="3" y="4.5" width="14" height="13" rx="2" />
            <path d="M6.5 2.5v4M13.5 2.5v4M3 8.5h14" />
          </svg>
        </Button>
      </Group>
      <ResizeSafePopover
        className="choice-popover calendar-popover"
        inert={!isOpen}
        aria-hidden={!isOpen}
        placement="bottom start"
        offset={8}
        containerPadding={12}
        shouldFlip
      >
        <Dialog className="calendar-dialog">
          <Calendar className="date-choice-calendar">
            <header className="calendar-header">
              <Button slot="previous" className="calendar-navigation">
                <svg
                  viewBox="0 0 20 20"
                  width="18"
                  height="18"
                  aria-hidden="true"
                >
                  <path d="m12 5-5 5 5 5" />
                </svg>
              </Button>
              <Heading className="calendar-heading" />
              <Button slot="next" className="calendar-navigation">
                <svg
                  viewBox="0 0 20 20"
                  width="18"
                  height="18"
                  aria-hidden="true"
                >
                  <path d="m8 5 5 5-5 5" />
                </svg>
              </Button>
            </header>
            <CalendarGrid className="calendar-grid">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="calendar-weekday">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(day) => <CalendarCell date={day} className="calendar-day" />}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
          <button
            className="calendar-clear-choice"
            type="button"
            aria-label="Clear reference date"
            onClick={clearDate}
          >
            Use today automatically
          </button>
        </Dialog>
      </ResizeSafePopover>
    </DatePicker>
  );
}
