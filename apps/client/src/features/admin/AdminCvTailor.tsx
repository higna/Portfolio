
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Code2, Download, FileClock, FileText, Loader2, Mail, MessageCircle, Pencil, Plus, Save, Send, Sparkles, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

type CvTemplate = 'ats' | 'modern' | 'classic';
type DocumentKind = 'cv' | 'cover-letter';
interface SavedDocument {
  id: string; kind: DocumentKind; title: string; candidateName: string;
  jobDescription: string; template: CvTemplate | null; content: string; updatedAt: string;
}
const templates: { id: CvTemplate; name: string; description: string }[] = [
  { id: 'ats', name: 'ATS-friendly', description: 'Simple structure, easy for applicant systems to read.' },
  { id: 'modern', name: 'Modern', description: 'Contemporary layout with a bold accent.' },
  { id: 'classic', name: 'Classic', description: 'Traditional typography and restrained styling.' },
];
const stripMarkdown = (line: string) => line.replace(/^#{1,3}\s*/, '').replace(/^\s*[-*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();
const lineKind = (line: string) => line.startsWith('# ') ? 'name' : line.startsWith('## ') ? 'section' : line.startsWith('### ') ? 'entry' : /^\s*[-*]\s+/.test(line) ? 'bullet' : 'body';

function escapeLatex(value: string) {
  const replacements: Record<string, string> = {
    '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#',
    '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
  };
  return value.replace(/[\\&%$#_{}~^]/g, (character) => replacements[character]);
}

function toLatex(content: string, template: CvTemplate) {
  const accent = template === 'classic' ? '25395B' : template === 'modern' ? 'A17123' : '222222';
  const output = [
    '\\documentclass[10pt,a4paper]{article}',
    '\\usepackage[utf8]{inputenc}',
    '\\usepackage[T1]{fontenc}',
    '\\usepackage{lmodern}',
    '\\usepackage[margin=0.72in]{geometry}',
    '\\usepackage{xcolor}',
    '\\usepackage{enumitem}',
    '\\usepackage{titlesec}',
    '\\usepackage[hidelinks]{hyperref}',
    `\\definecolor{accent}{HTML}{${accent}}`,
    '\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[\\titlerule]',
    '\\setlist[itemize]{leftmargin=1.25em,itemsep=2pt,topsep=3pt}',
    '\\pagestyle{empty}',
    '\\begin{document}',
  ];
  let inList = false;
  const closeList = () => { if (inList) output.push('\\end{itemize}'); inList = false; };
  for (const line of content.split(/\r?\n/)) {
    const text = stripMarkdown(line);
    const type = lineKind(line);
    if (!text) { closeList(); output.push(''); continue; }
    if (type !== 'bullet') closeList();
    if (type === 'name') output.push(`\\begin{center}{\\LARGE\\bfseries\\color{accent} ${escapeLatex(text)}}\\end{center}`);
    else if (type === 'section') output.push(`\\section*{${escapeLatex(text)}}`);
    else if (type === 'entry') output.push(`\\subsection*{${escapeLatex(text)}}`);
    else if (type === 'bullet') {
      if (!inList) { output.push('\\begin{itemize}'); inList = true; }
      output.push(`\\item ${escapeLatex(text)}`);
    } else output.push(`${escapeLatex(text)}\\par`);
  }
  closeList();
  output.push('\\end{document}');
  return output.join('\n');
}

function downloadLatex(content: string, template: CvTemplate, kind: DocumentKind) {
  const source = content.trim().startsWith('\\documentclass') ? content : toLatex(content, template);
  const blob = new Blob([source], { type: 'application/x-tex;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `application-${kind === 'cv' ? 'cv' : 'cover-letter'}-${template}.tex`;
  link.click();
  URL.revokeObjectURL(url);
}

function errorMessage(error: unknown) {
  const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string' ? message : error instanceof Error ? error.message : 'The request failed. Please try again.';
}

export default function AdminCvTailor() {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [profileName, setProfileName] = useState('');
  const [title, setTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [template, setTemplate] = useState<CvTemplate>('ats');
  const [kind, setKind] = useState<DocumentKind>('cv');
  const [content, setContent] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<DocumentKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState('');
  const [revisionMessages, setRevisionMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [revising, setRevising] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfVersion, setPdfVersion] = useState(0);
  const [compilingPdf, setCompilingPdf] = useState(false);

  const refreshDocuments = async () => {
    const response = await api.get<SavedDocument[]>('/chat/tailored-documents');
    setDocuments(response.data);
    setLoading(false);
  };
  useEffect(() => {
    api.get('/portfolio/cv-data').then((response) => setProfileName(response.data?.profile?.fullName ?? '')).catch(() => toast.error('Could not load the CV profile'));
    refreshDocuments().catch(() => { setLoading(false); toast.error('Could not load saved documents'); });
  }, []);

  useEffect(() => {
    if (!savedId) { setPdfUrl(null); setCompilingPdf(false); return; }
    let cancelled = false;
    let objectUrl: string | null = null;
    setPdfUrl(null);
    setCompilingPdf(true);
    api.get<Blob>(`/chat/tailored-documents/${savedId}/pdf`, { responseType: 'blob' })
      .then((response) => {
        objectUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        if (!cancelled) setPdfUrl(objectUrl);
      })
      .catch((error) => { if (!cancelled) toast.error(`Could not compile the LaTeX PDF: ${errorMessage(error)}`); })
      .finally(() => { if (!cancelled) setCompilingPdf(false); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [savedId, pdfVersion]);

  const startNew = () => {
    setSavedId(null); setTitle(''); setJobDescription(''); setContent(''); setKind('cv'); setTemplate('ats'); setRevisionMessages([]); setRevisionRequest(''); setView('editor');
  };
  const preview = useMemo(() => {
    if (content.trimStart().startsWith('\\documentclass')) return content;
    if (!content || !profileName) return content;
    if (kind === 'cover-letter') return content;
    const heading = content.match(/^#\s+.+$/m);
    return heading ? content.replace(heading[0], `# ${profileName}`) : `# ${profileName}\n\n${content}`;
  }, [content, kind, profileName]);
  const persist = async (text: string, existingId: string | null, documentKind = kind) => {
    if (!profileName.trim()) throw new Error('Add your name to the CV profile before saving.');
    const payload = {
      kind: documentKind, title: title.trim() || `${documentKind === 'cv' ? 'Tailored CV' : 'Cover Letter'} — ${profileName}`,
      candidateName: profileName, jobDescription: jobDescription.trim(), template: documentKind === 'cv' ? template : null, content: text,
    };
    const response = existingId
      ? await api.put<SavedDocument>(`/chat/tailored-documents/${existingId}`, payload)
      : await api.post<SavedDocument>('/chat/tailored-documents', payload);
    setSavedId(response.data.id); setTitle(response.data.title); setPdfVersion((version) => version + 1); await refreshDocuments();
    return response.data.id as string;
  };

  const generate = async (documentKind: DocumentKind) => {
    if (!profileName.trim()) { toast.error('Add your name to the CV profile first'); return; }
    if (!jobDescription.trim()) { toast.error('Enter a role or job description first'); return; }
    setGenerating(documentKind); setKind(documentKind); setContent(''); setSavedId(null);
    try {
      const endpoint = documentKind === 'cv' ? '/chat/tailor-cv' : '/chat/tailor-cover-letter';
      const response = await api.post(endpoint, { jobDescription: jobDescription.trim(), candidateName: profileName, template });
      const generated = response.data?.content;
      if (typeof generated !== 'string' || !generated.trim()) throw new Error('The AI returned an empty document. Please try again.');
      setContent(generated.trim());
      setRevisionMessages([]);
      try { await persist(generated.trim(), null, documentKind); toast.success('Generated and saved'); }
      catch (error) { toast.error(`Generated, but could not save: ${errorMessage(error)}`); }
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setGenerating(null); }
  };
  const saveChanges = async () => {
    if (!preview.trim() || !jobDescription.trim()) { toast.error('Add a role or job description before saving'); return; }
    setSaving(true);
    try { await persist(preview, savedId); toast.success('Document saved'); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setSaving(false); }
  };
  const reviseDocument = async () => {
    const instruction = revisionRequest.trim();
    if (!instruction || revising || !preview) return;
    setRevising(true);
    setRevisionRequest('');
    setRevisionMessages((messages) => [...messages, { role: 'user', content: instruction }]);
    try {
      const id = savedId || await persist(preview, null);
      const response = await api.post(`/chat/tailored-documents/${id}/revise`, { instruction });
      const revisedContent = response.data?.content;
      if (typeof revisedContent !== 'string' || !revisedContent.trim()) throw new Error('The revised document was empty. Please try again.');
      setContent(revisedContent.trim());
      setRevisionMessages((messages) => [...messages, { role: 'assistant', content: response.data?.reply || 'Updated the draft.' }]);
      try {
        await persist(revisedContent.trim(), id);
      } catch (error) {
        toast.error(`The revision is ready, but could not be saved: ${errorMessage(error)}`);
      }
    } catch (error) {
      setRevisionMessages((messages) => [...messages, { role: 'assistant', content: `I couldn't update the draft: ${errorMessage(error)}` }]);
    } finally { setRevising(false); }
  };
  const openDocument = (document: SavedDocument) => {
    setSavedId(document.id); setTitle(document.title); setKind(document.kind);
    setJobDescription(document.jobDescription); setTemplate(document.template ?? 'ats'); setContent(document.content); setRevisionMessages([]); setRevisionRequest(''); setPdfVersion((version) => version + 1); setView('editor');
  };
  const removeDocument = async (id: string) => {
    try { await api.delete(`/chat/tailored-documents/${id}`); setDocuments((items) => items.filter((item) => item.id !== id)); toast.success('Document deleted'); }
    catch (error) { toast.error(errorMessage(error)); }
  };

  if (view === 'list') return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl border-b-2 border-warning bg-[#090909] px-6 py-6 text-white shadow-lg sm:px-8 sm:py-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border border-warning/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-warning">Portfolio workspace</p><h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Tailored documents</h2><p className="mt-1 text-base text-white/65">Manage your saved CVs and cover letters, or create a new set for a role.</p></div><button onClick={startNew} className="btn btn-primary gap-2"><Plus className="size-4" /> New tailored CV</button></div>
      </section>
      {loading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl border border-base-content/10 bg-base-100" />)}</div>
        : documents.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{documents.map((document) => <article key={document.id} className="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className={`h-2 ${document.kind === 'cv' ? 'bg-primary' : 'bg-warning'}`} /><div className="space-y-5 p-5"><div className="flex items-start justify-between gap-3"><div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">{document.kind === 'cv' ? <FileText className="size-5" /> : <Mail className="size-5" />}</div><span className="badge badge-ghost">{document.kind === 'cv' ? 'Tailored CV' : 'Cover letter'}</span></div><div><h3 className="truncate text-lg font-semibold">{document.title}</h3><p className="mt-1 text-xs text-base-content/45">Updated {new Date(document.updatedAt).toLocaleDateString()}</p></div><div className="flex items-center justify-between border-t border-base-content/10 pt-3"><span className="text-xs text-base-content/45">{document.template ? `${document.template} style` : 'Application letter'}</span><div className="flex gap-1"><button onClick={() => openDocument(document)} className="btn btn-ghost btn-sm gap-2 text-primary"><Pencil className="size-3.5" /> Edit</button><button onClick={() => void removeDocument(document.id)} aria-label={`Delete ${document.title}`} className="btn btn-ghost btn-sm btn-square text-base-content/45 hover:text-error"><Trash2 className="size-4" /></button></div></div></div></article>)}</div>
        : <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-base-content/20 bg-base-100/70 px-6 text-center"><div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><FileClock className="size-6" /></div><h3 className="mt-4 text-lg font-semibold">No tailored documents yet</h3><p className="mt-1 max-w-md text-sm text-base-content/55">Start with a job description. Saved CVs and cover letters will appear here.</p><button onClick={startNew} className="btn btn-primary btn-sm mt-5 gap-2"><Plus className="size-4" /> Create your first CV</button></div>}
    </div>
  );

  return <div className="mx-auto w-full max-w-screen-2xl space-y-5">
    <header className="relative overflow-hidden rounded-2xl border-b-2 border-warning bg-[#090909] px-6 py-6 text-white shadow-lg sm:px-8"><div className="relative flex items-start gap-4"><button onClick={() => setView('list')} aria-label="Back to saved documents" className="btn btn-ghost btn-square btn-sm mt-1 text-white/70"><ArrowLeft className="size-4" /></button><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-warning/10 text-warning"><Sparkles className="size-6" /></div><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-warning">CV studio</p><h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{savedId ? 'Edit application document' : 'Create application documents'}</h2><p className="mt-2 max-w-2xl text-sm text-white/65">Your saved CV profile is used as the candidate. Paste a role description to generate a tailored CV or cover letter.</p></div></div></header>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"><div className="space-y-5">
      <section className="space-y-5 rounded-3xl border border-base-content/10 bg-base-100 p-5 shadow-sm sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-base-content/45">Application details</p><h3 className="mt-1 text-lg font-semibold">Set the document and role</h3></div>
        <label className="form-control gap-2"><span className="label-text text-sm font-medium">Document name</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} className="input input-bordered w-full" placeholder="Tailored CV" /></label>
        <label className="form-control gap-2"><span className="label-text text-sm font-medium">Role or job description</span><textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} maxLength={20000} rows={9} placeholder="Try ‘Tailor my CV for a data analyst role’ or paste the full job description, including required skills." className="textarea textarea-bordered w-full resize-y leading-6" /></label><div className="flex justify-between text-[11px] text-base-content/45"><span>A short prompt or full description works</span><span>{jobDescription.length.toLocaleString()} / 20,000</span></div>
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.14em] text-base-content/45">CV style</p><div className="grid gap-2 sm:grid-cols-3">{templates.map((item) => <button key={item.id} onClick={() => setTemplate(item.id)} aria-pressed={template === item.id} className={`rounded-xl border p-3 text-left ${template === item.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-base-content/10'}`}><span className="text-sm font-semibold">{item.name}</span><span className="mt-1 block text-[11px] text-base-content/50">{item.description}</span></button>)}</div></div>
        <div className="grid gap-2 sm:grid-cols-2"><button onClick={() => void generate('cv')} disabled={Boolean(generating)} className="btn btn-primary gap-2">{generating === 'cv' ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}{generating === 'cv' ? 'Generating CV…' : 'Generate tailored CV'}</button><button onClick={() => void generate('cover-letter')} disabled={Boolean(generating)} className="btn btn-outline gap-2 border-primary/40 text-primary">{generating === 'cover-letter' ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}{generating === 'cover-letter' ? 'Writing letter…' : 'Generate cover letter'}</button></div>
      </section>
<section className="overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 shadow-sm">
        <div className="flex items-center gap-2 border-b border-base-content/5 px-5 py-4"><MessageCircle className="size-4 text-primary" /><div><h3 className="font-semibold">Refine with AI</h3><p className="text-xs text-base-content/50">Ask for a focused change to this draft.</p></div></div>
        <div className="max-h-64 space-y-3 overflow-y-auto p-4">{revisionMessages.length ? revisionMessages.map((message, index) => <div key={index} className={'flex ' + (message.role === 'user' ? 'justify-end' : 'justify-start')}><p className={'max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ' + (message.role === 'user' ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content')}>{message.content}</p></div>) : <p className="text-sm text-base-content/50">Try “Make the summary more concise” or “Emphasize the SQL experience that matches this role.”</p>}{revising && <div className="flex items-center gap-2 text-sm text-base-content/50"><Loader2 className="size-4 animate-spin" /> Revising the draft…</div>}</div>
        <form className="flex items-end gap-2 border-t border-base-content/5 p-3" onSubmit={(event) => { event.preventDefault(); void reviseDocument(); }}><textarea value={revisionRequest} onChange={(event) => setRevisionRequest(event.target.value)} maxLength={5000} rows={2} placeholder="Tell the AI what to change…" className="textarea textarea-bordered min-h-12 flex-1 resize-y" disabled={!preview || revising} /><button type="submit" className="btn btn-primary btn-square" aria-label="Send revision request" disabled={!preview || !revisionRequest.trim() || revising}><Send className="size-4" /></button></form>
      </section>
</div>
<section className="overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-content/5 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-base-content/45">Compiled LaTeX preview</p><h3 className="mt-1 font-semibold">{kind === 'cv' ? `${templates.find((item) => item.id === template)?.name} CV` : 'Cover letter'}</h3></div><div className="flex flex-wrap gap-2"><button onClick={() => void saveChanges()} disabled={!preview || saving || Boolean(generating) || revising} className="btn btn-outline btn-sm gap-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{savedId ? 'Save changes' : 'Save draft'}</button><button onClick={() => downloadLatex(preview, template, kind)} disabled={!preview || Boolean(generating) || revising} className="btn btn-outline btn-sm gap-2"><Code2 className="size-4" /> .tex</button><button onClick={() => { if (!pdfUrl) return; const link = document.createElement('a'); link.href = pdfUrl; link.download = `${kind === 'cv' ? 'tailored-cv' : 'cover-letter'}.pdf`; link.click(); }} disabled={!pdfUrl || compilingPdf || Boolean(generating) || revising} className="btn btn-primary btn-sm gap-2">{compilingPdf ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}{compilingPdf ? 'Compiling PDF' : 'Download PDF'}</button></div></div><div className="m-4 max-h-[78vh] min-h-[32rem] overflow-y-auto rounded-xl border border-base-content/10 bg-base-200/30 sm:m-6">{pdfUrl ? <iframe title="Compiled LaTeX document preview" src={pdfUrl} className="h-[76vh] min-h-[32rem] w-full bg-white" /> : <div className="flex min-h-[32rem] flex-col items-center justify-center gap-3 p-6 text-center">{compilingPdf ? <Loader2 className="size-8 animate-spin text-primary" /> : <FileText className="size-8 text-base-content/35" />}<p className="text-sm text-base-content/55">{compilingPdf ? 'Compiling the LaTeX document…' : preview ? 'Generate or save the document to compile its PDF preview.' : 'Your compiled PDF preview will appear here.'}</p></div>}</div></section>
    </div>
  </div>;
}
