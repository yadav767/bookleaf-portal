// Small coloured label used for status and priority
export default function Badge({ value, type }) {
  const cls = `badge ${type}-${String(value).toLowerCase().replace(/\s+/g, "-")}`;
  return <span className={cls}>{value}</span>;
}
