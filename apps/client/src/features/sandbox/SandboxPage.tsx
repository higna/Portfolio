import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowLeft,
  ArrowDownToLine,
  CaseSensitive,
  Check,
  Columns3,
  Database,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Replace,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { readSheet } from 'read-excel-file/browser';
import writeXlsxFile from 'write-excel-file/browser';
import toast from 'react-hot-toast';

type DataRow = Record<string, string>;
type TextCase = 'unchanged' | 'lowercase' | 'uppercase' | 'title' | 'camel' | 'snake' | 'kebab';
type ToolTab = 'columns' | 'transform' | 'filter';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const PREVIEW_LIMIT = 50;

const sampleColumns = [
  'ticket_id',
  'customer_name',
  'support_team',
  'issue_type',
  'status',
  'priority',
  'assigned_agent',
  'created_at',
];

const sampleTemplates: DataRow[] = [
  { ticket_id: 'T-1001', customer_name: '  JANE DOE  ', support_team: 'CUSTOMER SUPPORT', issue_type: 'Password Reset', status: 'OPEN', priority: 'high', assigned_agent: 'maria okafor', created_at: '2026-10-04' },
  { ticket_id: 'T-1002', customer_name: 'Kwame Mensah', support_team: 'billing team', issue_type: 'Duplicate charge', status: 'Pending', priority: 'MEDIUM', assigned_agent: 'Kofi Boateng', created_at: '2026-10-05' },
  { ticket_id: 'T-1003', customer_name: 'Ama Owusu', support_team: 'CUSTOMER SUPPORT', issue_type: 'Mobile App Error', status: 'closed', priority: 'low', assigned_agent: 'maria okafor', created_at: '2026-10-06' },
  { ticket_id: 'T-1004', customer_name: 'Nana Agyeman', support_team: 'technical support', issue_type: 'Cannot Upload File', status: 'OPEN', priority: 'urgent', assigned_agent: 'Yaw Asante', created_at: '2026-10-06' },
  { ticket_id: 'T-1005', customer_name: '  Efua Addo', support_team: 'Billing Team ', issue_type: 'Refund Request', status: 'Pending', priority: 'medium', assigned_agent: 'Kofi Boateng', created_at: '2026-10-07' },
  { ticket_id: 'T-1006', customer_name: 'Kojo Arthur', support_team: 'technical support', issue_type: 'Login Failed', status: 'OPEN', priority: 'high', assigned_agent: '', created_at: '2026-10-08' },
  { ticket_id: 'T-1007', customer_name: 'Abena Frimpong', support_team: 'customer support', issue_type: 'Account Update', status: 'closed', priority: 'low', assigned_agent: 'maria okafor', created_at: '2026-10-09' },
  { ticket_id: 'T-1008', customer_name: 'Yaw Darko', support_team: 'Billing Team', issue_type: 'Duplicate Charge', status: 'OPEN', priority: 'MEDIUM', assigned_agent: 'Kofi Boateng', created_at: '2026-10-10' },
  { ticket_id: 'T-1009', customer_name: 'Akosua Baah', support_team: 'technical support', issue_type: 'Cannot Upload File', status: 'Pending', priority: 'urgent', assigned_agent: 'Yaw Asante', created_at: '2026-10-10' },
  { ticket_id: 'T-1010', customer_name: 'Kweku Osei', support_team: 'CUSTOMER SUPPORT', issue_type: 'Password Reset', status: 'closed', priority: 'low', assigned_agent: 'maria okafor', created_at: '2026-10-11' },
];

const generatedSampleRows: DataRow[] = Array.from({ length: 120 }, (_, index) => {
  const template = sampleTemplates[index % sampleTemplates.length];
  const day = String((index % 28) + 1).padStart(2, '0');
  return {
    ...template,
    ticket_id: `T-${1001 + index}`,
    created_at: `2026-10-${day}`,
  };
});

const sampleRows: DataRow[] = [
  ...generatedSampleRows,
  ...[0, 3, 8, 12, 19, 27, 34, 49, 63, 78, 92, 107].map((index) => ({
    ...generatedSampleRows[index],
  })),
];

const textCases: { value: TextCase; label: string }[] = [
  { value: 'unchanged', label: 'Keep current case' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'title', label: 'Title Case' },
  { value: 'camel', label: 'camelCase' },
  { value: 'snake', label: 'snake_case' },
  { value: 'kebab', label: 'kebab-case' },
];

function toWords(value: string): string[] {
  const spaced = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  return (spaced.match(/[A-Za-z0-9]+/g) ?? []).map((word) => word.toLocaleLowerCase());
}

function applyTextCase(value: string, textCase: TextCase): string {
  if (textCase === 'unchanged') return value;
  if (textCase === 'lowercase') return value.toLocaleLowerCase();
  if (textCase === 'uppercase') return value.toLocaleUpperCase();

  const words = toWords(value);
  if (textCase === 'title') {
    return words.map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1)).join(' ');
  }
  if (textCase === 'camel') {
    return words.map((word, index) => index === 0
      ? word
      : word.charAt(0).toLocaleUpperCase() + word.slice(1)).join('');
  }
  return words.join(textCase === 'snake' ? '_' : '-');
}

function replaceText(value: string, search: string, replacement: string, matchCase: boolean): string {
  if (!search) return value;
  if (matchCase) return value.split(search).join(replacement);
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.replace(new RegExp(escapedSearch, 'gi'), () => replacement);
}

function cellText(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '');
}

function makeUniqueHeaders(values: unknown[]): string[] {
  const seen = new Map<string, number>();
  return values.map((value, index) => {
    const base = String(value ?? '').trim() || `Column ${index + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

function gridToRows(grid: unknown[][]): { columns: string[]; rows: DataRow[] } {
  const firstNonEmptyRow = grid.findIndex((row) => row.some((cell) => cellText(cell).trim()));
  if (firstNonEmptyRow < 0) throw new Error('The selected worksheet is empty.');

  const columns = makeUniqueHeaders(grid[firstNonEmptyRow]);
  const rows = grid.slice(firstNonEmptyRow + 1)
    .filter((row) => row.some((cell) => cellText(cell).trim()))
    .map((row) => Object.fromEntries(columns.map((column, index) => [column, cellText(row[index])])));

  if (columns.length === 0) throw new Error('No column headers were found in the first populated row.');
  return { columns, rows };
}

function cleanFileBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'cleaned_data';
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows[0]?.[0]?.charCodeAt(0) === 0xfeff) rows[0][0] = rows[0][0].slice(1);
  return rows;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function SandboxPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const slowX = useSpring(mouseX, { stiffness: 30, damping: 40 });
  const slowY = useSpring(mouseY, { stiffness: 30, damping: 40 });
  const [columns, setColumns] = useState(sampleColumns);
  const [sourceRows, setSourceRows] = useState(sampleRows);
  const [fileName, setFileName] = useState('support_tickets_test_data.csv');
  const [selectedColumn, setSelectedColumn] = useState(sampleColumns[0]);
  const [renameDraft, setRenameDraft] = useState(sampleColumns[0]);
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [removedColumns, setRemovedColumns] = useState<string[]>([]);
  const [textCasesByColumn, setTextCasesByColumn] = useState<Record<string, TextCase>>({});
  const [trimWhitespace, setTrimWhitespace] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [duplicateKeyColumns, setDuplicateKeyColumns] = useState<string[]>(sampleColumns);
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [replaceColumns, setReplaceColumns] = useState<string[]>([]);
  const [matchCase, setMatchCase] = useState(false);
  const [filterColumn, setFilterColumn] = useState('');
  const [filterText, setFilterText] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toolTab, setToolTab] = useState<ToolTab>('columns');

  const visibleColumns = useMemo(
    () => columns.filter((column) => !removedColumns.includes(column)),
    [columns, removedColumns],
  );

  const transformedRows = useMemo(() => sourceRows.map((source) => Object.fromEntries(
      visibleColumns.map((column) => {
        let value = source[column] ?? '';
        if (trimWhitespace) value = value.trim();
        if (replaceColumns.includes(column) && findValue) {
          value = replaceText(value, findValue, replaceValue, matchCase);
        }
        value = applyTextCase(value, textCasesByColumn[column] || 'unchanged');
        return [renames[column] || column, value];
      }),
    )), [sourceRows, visibleColumns, renames, trimWhitespace, replaceColumns, findValue, replaceValue, matchCase, textCasesByColumn]);

  const selectedDuplicateKeys = useMemo(
    () => duplicateKeyColumns.filter((column) => visibleColumns.includes(column)),
    [duplicateKeyColumns, visibleColumns],
  );

  const dedupedRows = useMemo(() => {
    if (!removeDuplicates || selectedDuplicateKeys.length === 0) return transformedRows;
    const seen = new Set<string>();
    return transformedRows.filter((row) => {
      const signature = JSON.stringify(selectedDuplicateKeys.map((column) => row[renames[column] || column] ?? ''));
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }, [transformedRows, removeDuplicates, selectedDuplicateKeys, renames]);

  const processedRows = useMemo(() => {
    let rows = dedupedRows;
    if (filterText.trim()) {
      const query = filterText.trim().toLocaleLowerCase();
      const key = filterColumn ? renames[filterColumn] || filterColumn : null;
      rows = rows.filter((row) => key
        ? String(row[key] ?? '').toLocaleLowerCase().includes(query)
        : Object.values(row).some((value) => value.toLocaleLowerCase().includes(query)));
    }

    return rows;
  }, [dedupedRows, renames, filterText, filterColumn]);

  const missingCells = useMemo(() => sourceRows.reduce(
    (total, row) => total + visibleColumns.filter((column) => !String(row[column] ?? '').trim()).length,
    0,
  ), [sourceRows, visibleColumns]);

  const duplicateRowsRemoved = transformedRows.length - dedupedRows.length;

  const importFile = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Choose a file smaller than 20 MB.');
      return;
    }

    setIsReading(true);
    try {
      const grid = file.name.toLocaleLowerCase().endsWith('.csv')
        ? parseCsv(await file.text())
        : await readSheet(file, 1, { trim: false });
      const result = gridToRows(grid);
      setColumns(result.columns);
      setSourceRows(result.rows);
      setSelectedColumn(result.columns[0]);
      setRenameDraft(result.columns[0]);
      setRenames({});
      setRemovedColumns([]);
      setTextCasesByColumn({});
      setTrimWhitespace(false);
      setRemoveDuplicates(false);
      setDuplicateKeyColumns(result.columns);
      setFindValue('');
      setReplaceValue('');
      setReplaceColumns([]);
      setMatchCase(false);
      setFilterColumn('');
      setFilterText('');
      setFileName(file.name);
      toast.success(`Loaded ${result.rows.length.toLocaleString()} rows from ${file.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not read this file.');
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const applyRename = () => {
    const nextName = renameDraft.trim();
    if (!selectedColumn || !nextName) {
      toast.error('Enter a name for the selected column.');
      return;
    }
    const conflict = visibleColumns.some((column) => column !== selectedColumn && (renames[column] || column).toLocaleLowerCase() === nextName.toLocaleLowerCase());
    if (conflict) {
      toast.error('Another column already uses that name.');
      return;
    }
    setRenames((current) => ({ ...current, [selectedColumn]: nextName }));
    toast.success('Column name updated in the preview.');
  };

  const removeSelectedColumn = () => {
    if (visibleColumns.length < 2) {
      toast.error('Keep at least one column in the dataset.');
      return;
    }
    setRemovedColumns((current) => [...current, selectedColumn]);
    setDuplicateKeyColumns((current) => current.filter((column) => column !== selectedColumn));
    setReplaceColumns((current) => current.filter((column) => column !== selectedColumn));
    if (filterColumn === selectedColumn) setFilterColumn('');
    const nextColumn = visibleColumns.find((column) => column !== selectedColumn) || columns[0];
    setSelectedColumn(nextColumn);
    setRenameDraft(renames[nextColumn] || nextColumn);
  };

  const resetSample = () => {
    setColumns(sampleColumns);
    setSourceRows(sampleRows);
    setFileName('support_tickets_test_data.csv');
    setSelectedColumn(sampleColumns[0]);
    setRenameDraft(sampleColumns[0]);
    setRenames({});
    setRemovedColumns([]);
    setTextCasesByColumn({});
    setTrimWhitespace(false);
    setRemoveDuplicates(false);
    setDuplicateKeyColumns(sampleColumns);
    setFindValue('');
    setReplaceValue('');
    setReplaceColumns([]);
    setMatchCase(false);
    setFilterColumn('');
    setFilterText('');
  };

  const toggleDuplicateKey = (column: string) => {
    setDuplicateKeyColumns((current) => current.includes(column)
      ? current.filter((item) => item !== column)
      : [...current, column]);
  };

  const toggleReplaceColumn = (column: string) => {
    setReplaceColumns((current) => current.includes(column)
      ? current.filter((item) => item !== column)
      : [...current, column]);
  };

  const downloadExcel = async () => {
    setIsExporting(true);
    try {
      const headers = visibleColumns.map((column) => renames[column] || column);
      const rows = processedRows.map((row) => headers.map((header) => row[header] ?? ''));
      const file = await writeXlsxFile([headers, ...rows], { sheet: 'Cleaned data' });
      downloadBlob(await file.toBlob(), `${cleanFileBaseName(fileName)}_cleaned.xlsx`);
    } catch {
      toast.error('Could not create the Excel file.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCsv = () => {
    const headers = visibleColumns.map((column) => renames[column] || column);
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [headers, ...processedRows.map((row) => headers.map((header) => row[header] ?? ''))]
      .map((row) => row.map(escapeCsv).join(','));
    const blob = new Blob(['\ufeff', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${cleanFileBaseName(fileName)}_cleaned.csv`);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => void importFile(event.target.files?.[0]);
  const handleHeroMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = heroRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    mouseX.set(x * 8);
    mouseY.set(y * 8);
  };
  const previewRows = processedRows.slice(0, PREVIEW_LIMIT);
  const isSampleData = fileName === 'support_tickets_test_data.csv';
  return (
    <div className="min-h-screen bg-base-100">
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative -mt-16 flex h-[55vh] min-h-90 items-center overflow-hidden bg-black"
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-bottom opacity-80"
          style={{ backgroundImage: "url('/hero2.png')", x: slowX, y: slowY, scale: 1.15 }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-6 lg:px-12">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-white/70 transition-colors hover:text-[#D4AF37]">
            <ArrowLeft className="size-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="mb-3 flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-[#D4AF37] sm:text-sm"><Sparkles className="size-4" /> DATA WORKSPACE</p>
            <h1 className="mb-4 font-['Cormorant_Garamond'] text-4xl font-bold text-white md:text-5xl lg:text-6xl">Sandbox</h1>
            <p className="max-w-xl text-lg text-white/80">Explore, clean, and reshape data before exporting. Your files stay in this browser.</p>
            <div className="mt-6 h-px w-24 bg-[#D4AF37]" />
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={resetSample} className="btn btn-ghost border border-white/20 text-white hover:bg-white/10"><RotateCcw className="size-4" /> Reset sample</button>
              <button onClick={() => inputRef.current?.click()} disabled={isReading} className="btn btn-primary gap-2"><Upload className="size-4" /> {isReading ? 'Reading file…' : 'Upload CSV / XLSX'}</button>
              <input ref={inputRef} type="file" accept=".csv,.xlsx" onChange={handleFileInput} className="hidden" />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-base-content/10 bg-base-100 px-4 py-3 shadow-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Database className="size-5" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="max-w-[min(70vw,36rem)] truncate text-sm font-semibold text-base-content">{fileName}</strong>
              <span className={`badge badge-sm ${isSampleData ? 'badge-warning badge-outline' : 'badge-success badge-outline'}`}>{isSampleData ? 'Synthetic sample' : 'Loaded locally'}</span>
            </div>
            <p className="mt-1 text-xs text-base-content/50">{sourceRows.length.toLocaleString()} source rows · {columns.length} source columns</p>
          </div>
        </div>
        <p className="text-xs text-base-content/50">Private browser workspace · 20 MB maximum</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Source rows', value: sourceRows.length.toLocaleString(), note: 'Loaded into this workspace', icon: Database },
          { label: 'Matching rows', value: processedRows.length.toLocaleString(), note: 'After filtering and deduplication', icon: Search },
          { label: 'Columns kept', value: visibleColumns.length.toLocaleString(), note: `${removedColumns.length} removed`, icon: Columns3 },
          { label: 'Blank cells', value: missingCells.toLocaleString(), note: 'Across visible source columns', icon: Filter },
        ].map((stat) => (
          <article key={stat.label} className="flex items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm transition-shadow hover:shadow-md">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-base-200 text-primary"><stat.icon className="size-4" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[.13em] text-base-content/45">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold leading-none tracking-tight">{stat.value}</p>
              <p className="mt-1 truncate text-xs text-base-content/50">{stat.note}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-sm xl:sticky xl:top-24">
          <div className="border-b border-base-content/10 bg-base-200/50 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-primary">Data tools</p>
            <h2 className="mt-1 text-lg font-semibold">Shape your dataset</h2>
            <p className="mt-1 text-xs text-base-content/50">Choose a workspace, then preview changes on the right.</p>
          </div>

          <div role="tablist" aria-label="Sandbox tools" className="grid grid-cols-3 gap-1 border-b border-base-content/10 p-2">
            {([
              { key: 'columns', label: 'Columns', icon: Columns3 },
              { key: 'transform', label: 'Transform', icon: Sparkles },
              { key: 'filter', label: 'Filter', icon: Filter },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={toolTab === key}
                onClick={() => setToolTab(key)}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${toolTab === key ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'}`}
              >
                <Icon className="size-3.5" />{label}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100vh-17rem)] space-y-4 overflow-y-auto p-4">
            <label className="form-control gap-2">
              <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/50">Selected column</span>
              <select value={selectedColumn} onChange={(event) => { setSelectedColumn(event.target.value); setRenameDraft(renames[event.target.value] || event.target.value); }} className="select select-bordered select-sm w-full">
                {visibleColumns.map((column) => <option key={column} value={column}>{renames[column] || column}</option>)}
              </select>
            </label>

            {toolTab === 'columns' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-base-content/10 p-3">
                  <p className="text-sm font-semibold">Rename column</p>
                  <p className="mt-1 text-xs text-base-content/50">Update the header without changing the values.</p>
                  <div className="join mt-3 w-full">
                    <input value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && applyRename()} className="input input-bordered input-sm join-item min-w-0 flex-1" />
                    <button onClick={applyRename} className="btn btn-primary btn-sm join-item" aria-label="Apply column name"><Check className="size-4" /></button>
                  </div>
                </div>

                <button onClick={removeSelectedColumn} className="btn btn-outline btn-error btn-sm w-full justify-start"><Trash2 className="size-4" /> Remove selected column</button>

                {removedColumns.length > 0 && (
                  <div className="rounded-xl bg-base-200/60 p-3">
                    <p className="text-xs font-semibold text-base-content/60">Removed columns</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {removedColumns.map((column) => (
                        <button
                          key={column}
                          type="button"
                          onClick={() => setRemovedColumns((current) => current.filter((item) => item !== column))}
                          className="badge badge-outline cursor-pointer gap-1 py-3 hover:badge-primary"
                          title={`Restore ${renames[column] || column}`}
                        >
                          + {renames[column] || column}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {toolTab === 'transform' && (
              <div className="space-y-4">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-base-content/10 p-3">
                  <input type="checkbox" checked={trimWhitespace} onChange={(event) => setTrimWhitespace(event.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
                  <span><span className="block text-sm font-medium">Trim whitespace</span><span className="block text-xs text-base-content/50">Remove spaces at the start and end.</span></span>
                </label>

                <label className="form-control gap-2 rounded-xl border border-base-content/10 p-3">
                  <span className="label-text flex items-center gap-2 text-sm font-semibold"><CaseSensitive className="size-4 text-primary" /> Text case</span>
                  <span className="text-xs text-base-content/50">Apply to {renames[selectedColumn] || selectedColumn}.</span>
                  <select value={textCasesByColumn[selectedColumn] || 'unchanged'} onChange={(event) => setTextCasesByColumn((current) => ({ ...current, [selectedColumn]: event.target.value as TextCase }))} className="select select-bordered select-sm w-full">
                    {textCases.map((textCase) => <option key={textCase.value} value={textCase.value}>{textCase.label}</option>)}
                  </select>
                </label>

                <div className="space-y-3 rounded-xl border border-base-content/10 p-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold"><Replace className="size-4 text-primary" /> Find &amp; replace</p>
                    <p className="mt-1 text-xs text-base-content/50">Choose which columns to update.</p>
                  </div>
                  <input value={findValue} onChange={(event) => setFindValue(event.target.value)} className="input input-bordered input-sm w-full" placeholder="Find text" />
                  <input value={replaceValue} onChange={(event) => setReplaceValue(event.target.value)} className="input input-bordered input-sm w-full" placeholder="Replace with" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-base-content/60">{replaceColumns.length} columns selected</span>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setReplaceColumns(replaceColumns.length === visibleColumns.length ? [] : [...visibleColumns])}>
                      {replaceColumns.length === visibleColumns.length ? 'Clear' : 'Select all'}
                    </button>
                  </div>
                  <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg bg-base-200/60 p-2">
                    {visibleColumns.map((column) => (
                      <label key={column} className="flex cursor-pointer items-center gap-2 py-0.5 text-xs">
                        <input type="checkbox" className="checkbox checkbox-primary checkbox-xs" checked={replaceColumns.includes(column)} onChange={() => toggleReplaceColumn(column)} />
                        <span className="truncate">{renames[column] || column}</span>
                      </label>
                    ))}
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-base-content/70">
                    <input type="checkbox" checked={matchCase} onChange={(event) => setMatchCase(event.target.checked)} className="checkbox checkbox-primary checkbox-xs" />
                    Match case
                  </label>
                </div>

                <details className="rounded-xl border border-base-content/10">
                  <summary className="cursor-pointer px-3 py-3 text-sm font-semibold">Remove duplicate rows</summary>
                  <div className="space-y-3 border-t border-base-content/10 p-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" checked={removeDuplicates} onChange={(event) => setRemoveDuplicates(event.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
                      Enable duplicate removal
                    </label>
                    {removeDuplicates && (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-base-content/60">Compare selected fields</p>
                          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setDuplicateKeyColumns(selectedDuplicateKeys.length === visibleColumns.length ? [] : [...visibleColumns])}>
                            {selectedDuplicateKeys.length === visibleColumns.length ? 'Clear' : 'Select all'}
                          </button>
                        </div>
                        <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg bg-base-200/60 p-2">
                          {visibleColumns.map((column) => (
                            <label key={column} className="flex cursor-pointer items-center gap-2 py-0.5 text-xs">
                              <input type="checkbox" className="checkbox checkbox-primary checkbox-xs" checked={duplicateKeyColumns.includes(column)} onChange={() => toggleDuplicateKey(column)} />
                              <span className="truncate">{renames[column] || column}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-base-content/50">
                          {selectedDuplicateKeys.length === 0 ? 'Select at least one field to compare.' : `${duplicateRowsRemoved.toLocaleString()} duplicate rows removed. All columns remain in the output.`}
                        </p>
                      </>
                    )}
                  </div>
                </details>
              </div>
            )}

            {toolTab === 'filter' && (
              <div className="space-y-6">
                <label className="form-control gap-3 rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
                  <span className="label-text flex items-center gap-2 text-sm font-semibold"><Filter className="size-4 text-primary" /> Find rows</span>
                  <span className="text-xs text-base-content/50">Search within one column or across the whole dataset.</span>
                  <select value={filterColumn} onChange={(event) => setFilterColumn(event.target.value)} className="select select-bordered w-full">
                    <option value="">Search every column</option>
                    {visibleColumns.map((column) => <option key={column} value={column}>{renames[column] || column}</option>)}
                  </select>
                  <div className="join w-full">
                    <input value={filterText} onChange={(event) => setFilterText(event.target.value)} className="input input-bordered join-item min-w-0 flex-1" placeholder="Contains…" />
                    <button type="button" onClick={() => { setFilterText(''); setFilterColumn(''); }} disabled={!filterText && !filterColumn} className="btn btn-outline join-item">Clear</button>
                  </div>
                </label>
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Matching rows</p>
                  <p className="mt-1 text-2xl font-semibold">{processedRows.length.toLocaleString()} <span className="text-sm font-normal text-base-content/50">of {sourceRows.length.toLocaleString()}</span></p>
                </div>
              </div>
            )}

            <p className="rounded-xl bg-base-200/70 p-3 text-xs leading-relaxed text-base-content/55">
              Changes appear in the preview immediately. Export includes all matching rows.
            </p>
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-content/10 px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2"><Columns3 className="size-4 text-primary" /><h2 className="font-semibold">Data preview</h2></div>
              <p className="mt-1 truncate text-xs text-base-content/50">{processedRows.length.toLocaleString()} rows · {visibleColumns.length} columns</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadCsv} disabled={!processedRows.length} className="btn btn-outline btn-sm gap-2"><ArrowDownToLine className="size-4" /> CSV</button>
              <button onClick={() => void downloadExcel()} disabled={!processedRows.length || isExporting} className="btn btn-primary btn-sm gap-2"><FileSpreadsheet className="size-4" /> {isExporting ? 'Building…' : 'Excel'}</button>
            </div>
          </div>

          {processedRows.length ? (
            <>
              <div className="max-h-[65vh] overflow-auto">
                <table className="table table-zebra table-sm min-w-max">
                  <thead className="sticky top-0 z-10 bg-base-200 text-base-content/70">
                    <tr>{visibleColumns.map((column) => <th key={column} className="whitespace-nowrap">{renames[column] || column}</th>)}</tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>{visibleColumns.map((column) => <td key={column} className="max-w-64 whitespace-nowrap">{row[renames[column] || column] || <span className="italic text-base-content/30">Empty</span>}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {processedRows.length > PREVIEW_LIMIT && <p className="border-t border-base-content/10 px-5 py-3 text-xs text-base-content/50">Showing first {PREVIEW_LIMIT} rows. Downloads include all {processedRows.length.toLocaleString()} matching rows.</p>}
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Search className="size-8 text-base-content/25" />
              <p className="mt-3 font-medium">No rows match this filter</p>
              <button onClick={() => { setFilterText(''); setFilterColumn(''); }} className="btn btn-ghost btn-sm mt-2">Clear filter</button>
            </div>
          )}
        </section>
      </div>

      <div className="flex items-center gap-2 pb-4 text-xs text-base-content/45"><Database className="size-3.5" /> Sample data is synthetic. Uploaded files are processed in your browser and are not sent to the server.</div>
      </div>
    </div>
  );
}
