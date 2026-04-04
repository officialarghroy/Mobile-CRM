/** Row shape for `events` table (client and server). */
export type CalendarEventRow = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  user_name: string | null;
};

export function formatCalendarTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime && !endTime) return "Time not set";
  const start = startTime
    ? new Date(startTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "TBD";
  const end = endTime
    ? new Date(endTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "TBD";
  return `${start} - ${end}`;
}
