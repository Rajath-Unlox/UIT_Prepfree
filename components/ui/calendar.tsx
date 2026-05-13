"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  calendarEvents = [],
  ...props
}: any) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-white group/calendar p-5 [--cell-size:--spacing(12)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent dark:bg-neutral-950",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "w-[75%] flex gap-2 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-2", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 px-2 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-10 w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-neutral-950 border border-neutral-200 shadow-xs has-focus:ring-neutral-950/50 has-focus:ring-[3px] rounded-md dark:has-focus:border-neutral-300 dark:border-neutral-800 dark:has-focus:ring-neutral-300/50",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-white inset-0 opacity-0 dark:bg-neutral-950",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-1 pr-1 flex items-center gap-1 text-sm h-6 [&>svg]:text-neutral-500 [&>svg]:size-3.5 dark:[&>svg]:text-neutral-400",
          defaultClassNames.caption_label
        ),
        table: "w-full h-full border-collapse !border-spacing-0",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-neutral-500 rounded-md flex-1 font-normal text-[0.9rem] select-none dark:text-neutral-400",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.9rem] select-none text-neutral-500 dark:text-neutral-400",
          defaultClassNames.week_number
        ),
        day: cn(
          "p-0 m-0 relative aspect-square flex flex-1 items-center justify-center !rounded-md",
          "[data-has-event=true]:border [data-has-event=true]:border-[#f2825c]",
          "[data-selected-single=true]:bg-[#f2825c] [data-selected-single=true]:text-[#fffafa]",
          defaultClassNames.day
        ),

        range_start: cn(
          "rounded-l-md bg-neutral-100 dark:bg-neutral-800",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "rounded-r-md bg-neutral-100 dark:bg-neutral-800",
          defaultClassNames.range_end
        ),
        today: cn(
          "bg-neutral-100 text-neutral-900 rounded-md data-[selected=true]:rounded-none dark:bg-neutral-800 dark:text-neutral-50",
          defaultClassNames.today
        ),
        outside: cn(
          "text-neutral-500 aria-selected:text-neutral-500 dark:text-neutral-400 dark:aria-selected:text-neutral-400",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-neutral-500 opacity-50 dark:text-neutral-400",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },

        // 👇 FIX: PASS EVENTS TO DAY BUTTON
        DayButton: (props) => (
          <CalendarDayButton {...props} calendarEvents={calendarEvents} />
        ),

        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

// ---- ADD YOUR EVENTS HERE ----
// REMOVE THIS (hardcoded)
// const events: Record<string, { title: string; description: string }> = { ... };

// const events = React.useMemo(() => {
//   if (!calendarEvents) return {};
//   return calendarEvents.reduce(
//     (acc: Record<string, { title: string; description: string }>, item) => {
//       acc[item.date] = {
//         title: item.title,
//         description: item.description || "",
//       };
//       return acc;
//     },
//     {}
//   );
// }, [calendarEvents]);

// Helper → yyyy-mm-dd
const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  try {
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

function CalendarDayButton({
  className,
  day,
  modifiers,
  calendarEvents = [],
  ...props
}: any) {
  const defaultClassNames = getDefaultClassNames();

  const dateKey = formatDate(day?.date);

  // 🔥 find event for the date
  const event = calendarEvents.find((ev: any) => ev.date === dateKey);
  const isSelected =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle;

  const button = (
    <Button
      size="icon"
      variant="ghost"
      data-selected-single={isSelected}
      className={cn(
        "flex aspect-square h-[90%] w-[90%] p-0 items-center justify-center rounded-sm text-sm font-normal",
        isSelected && "bg-[#f2825c] text-[#fffafa] hover:bg-[#184852] hover:text-[#fffafa]",
        !isSelected && event && "border border-[#f2825c] hover:bg-[#fff0ea]",
        !isSelected && !event && "hover:bg-[#f7fbfa]",
        className
      )}
      {...props}
    >
      {day?.date.getDate?.() ?? ""}
    </Button>
  );

  return event ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent className="shadow-lg p-3 rounded-xl">
          <p className="font-semibold">{event.title}</p>
          <p className="opacity-70 text-sm">{event.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    button
  );
}

export { Calendar, CalendarDayButton };
