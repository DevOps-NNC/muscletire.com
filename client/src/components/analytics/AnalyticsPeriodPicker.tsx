import { reportingPeriods, type ReportingPeriod } from "@shared/analytics";

const labels: Record<ReportingPeriod, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last_7_days: "Last 7 days",
  last_28_days: "Last 28 days",
  last_30_days: "Last 30 days",
  this_month: "This month",
  previous_month: "Previous month",
  last_90_days: "Last 90 days",
  year_to_date: "Year to date",
  last_12_months: "Last 12 months",
  custom: "Custom range",
};

export function AnalyticsPeriodPicker({ value, onChange, startDate, endDate, onCustomRangeChange }: { value: ReportingPeriod; onChange: (value: ReportingPeriod) => void; startDate?: string; endDate?: string; onCustomRangeChange?: (range: { startDate: string; endDate: string }) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
      <span className="sr-only">Reporting period</span>
      <select value={value} onChange={event => onChange(event.target.value as ReportingPeriod)} className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {reportingPeriods.map(period => <option key={period} value={period}>{labels[period]}</option>)}
      </select>
      {value === "custom" && <><label className="sr-only" htmlFor="analytics-start-date">Start date</label><input id="analytics-start-date" type="date" value={startDate ?? ""} onChange={event => onCustomRangeChange?.({ startDate: event.target.value, endDate: endDate ?? "" })} className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold text-foreground shadow-sm" /><span className="text-muted-foreground">to</span><label className="sr-only" htmlFor="analytics-end-date">End date</label><input id="analytics-end-date" type="date" value={endDate ?? ""} onChange={event => onCustomRangeChange?.({ startDate: startDate ?? "", endDate: event.target.value })} className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold text-foreground shadow-sm" /></>}
    </div>
  );
}

export { labels as analyticsPeriodLabels };
