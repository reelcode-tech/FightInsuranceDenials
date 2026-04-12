import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { extractDenialData, generateAppealLetter } from "@/src/lib/gemini";
import { ExtractionResult, DenialRecord, AppealDraft } from "@/src/types";
import { Loader2, Upload, FileText, CheckCircle2, ChevronRight, AlertCircle, Mail, FileUp, MessageSquare, ShieldCheck, Download, Copy } from 'lucide-react';
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import {
  buildAppealDraftInput,
  buildEditableAppealFields,
  mergeAppealExtraction,
  validateUploadFileMeta,
} from "@/src/lib/intakePipeline";

export default function AppealGenerator() {
  const [step, setStep] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [rawText, setRawText] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [editableFields, setEditableFields] = useState(() => buildEditableAppealFields(null));
  const [narrative, setNarrative] = useState("");
  const [appealDraft, setAppealDraft] = useState<AppealDraft | null>(null);
  const [isGeneratingAppeal, setIsGeneratingAppeal] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateUploadFileMeta({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!validation.ok) {
      toast.error(validation.error);
      e.target.value = '';
      return;
    }

    setIsExtracting(true);
    const toastId = toast.loading("Analyzing document with AI...");
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await extractDenialData("", { data: base64, mimeType: file.type });
          setExtractedData(result);
          setEditableFields(buildEditableAppealFields(result));
          setStep(2);
          toast.success("Document analyzed!", { id: toastId });
        } catch (err) {
          toast.error("Analysis failed. Try pasting text instead.", { id: toastId });
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to read file.", { id: toastId });
      setIsExtracting(false);
    }
  };

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    const toastId = toast.loading("Analyzing text...");
    try {
      const result = await extractDenialData(rawText);
      setExtractedData(result);
      setEditableFields(buildEditableAppealFields(result));
      setStep(2);
      toast.success("Data extracted!", { id: toastId });
    } catch (error) {
      toast.error("Extraction failed.", { id: toastId });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateAppeal = async () => {
    if (!extractedData) return;
    setIsGeneratingAppeal(true);
    const toastId = toast.loading("Drafting professional appeal...");
    try {
      const denial: DenialRecord = buildAppealDraftInput({
        extracted: mergeAppealExtraction({ extracted: extractedData, editable: editableFields }),
        narrative,
      });
      const draft = await generateAppealLetter(denial);
      setAppealDraft(draft);
      setStep(3);
      toast.success("Appeal letter ready!", { id: toastId });
    } catch (error) {
      toast.error("Failed to generate appeal.", { id: toastId });
    } finally {
      setIsGeneratingAppeal(false);
    }
  };

  const downloadPDF = () => {
    if (!appealDraft) return;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Subject: ${appealDraft.subject}`, 20, 20);
    const splitBody = doc.splitTextToSize(appealDraft.body, 170);
    doc.text(splitBody, 20, 40);
    doc.save(`Appeal_Letter_${extractedData?.insurer || 'Insurer'}.pdf`);
    toast.success("PDF Downloaded!");
  };

  const copyToClipboard = () => {
    if (!appealDraft) return;
    navigator.clipboard.writeText(`${appealDraft.subject}\n\n${appealDraft.body}`);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div 
            className="bg-blue-600/5 border-2 border-dashed border-blue-500/20 rounded-[2rem] p-12 flex flex-col items-center justify-center space-y-6 cursor-pointer group hover:bg-blue-600/10 hover:border-blue-500/40 transition-all duration-500"
            onClick={() => document.getElementById('file-upload-tool')?.click()}
          >
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-900/40 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-bold text-white">Upload Denial Letter</p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">PDF, JPG, PNG</p>
            </div>
            <input id="file-upload-tool" type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
          </div>

          <div className="space-y-6">
            <textarea
              className="min-h-[200px] w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm font-light text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Or paste the text from your denial letter here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <Button className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-bold shadow-xl shadow-blue-900/20" onClick={handleExtract} disabled={isExtracting || !rawText.trim()}>
              {isExtracting ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <ChevronRight className="mr-3 h-5 w-5" />}
              Analyze Denial
            </Button>
          </div>
        </div>
      )}

      {step === 2 && extractedData && (
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 space-y-12 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: "Insurer", value: extractedData.insurer || "Private Carrier" },
              { label: "Plan", value: extractedData.planType || "Plan not found" },
              { label: "Procedure", value: extractedData.procedure || "Medical Service" },
              { label: "Reason", value: extractedData.denialReason || "Coverage Denial" },
            ].map((field, i) => (
              <div key={i} className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em]">{field.label}</label>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white">{field.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <label className="text-xl font-bold text-white">Fix anything the AI got wrong</label>
            <p className="text-sm leading-7 text-slate-400">
              The draft should use your real insurer, plan, treatment, deadline, and denial language. Change anything here before we write the appeal.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[
                { key: 'insurer', label: 'Insurer', placeholder: 'UnitedHealthcare' },
                { key: 'planType', label: 'Plan name or type', placeholder: 'Choice Plus PPO' },
                { key: 'procedure', label: 'Drug / procedure / service', placeholder: 'Taltz' },
                { key: 'denialReason', label: 'Denial reason', placeholder: 'Prior authorization denied' },
                { key: 'appealDeadline', label: 'Appeal deadline', placeholder: '180 days from denial letter' },
                { key: 'date', label: 'Denial date', placeholder: 'YYYY-MM-DD' },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em]">
                    {field.label}
                  </label>
                  <Input
                    value={editableFields[field.key as keyof typeof editableFields]}
                    placeholder={field.placeholder}
                    className="h-14 rounded-2xl border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setEditableFields((current) => ({
                        ...current,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em]">
                Exact denial language
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/5 p-5 font-light text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste the exact quote from the denial letter if the AI missed it."
                value={editableFields.denialQuote}
                onChange={(e) =>
                  setEditableFields((current) => ({
                    ...current,
                    denialQuote: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xl font-bold text-white">Add Personal Context</label>
            <textarea
              className="min-h-[120px] w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-light text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Explain how this denial impacts your health or daily life. AI will use this to strengthen the appeal."
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
            />
          </div>

          <div className="flex justify-between pt-8">
            <Button variant="ghost" className="h-14 px-8 rounded-full text-slate-400" onClick={() => setStep(1)}>Back</Button>
            <Button className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-xl shadow-blue-900/20" onClick={handleGenerateAppeal} disabled={isGeneratingAppeal}>
              {isGeneratingAppeal ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <FileText className="mr-3 h-5 w-5" />}
              Generate Appeal Letter
            </Button>
          </div>
        </div>
      )}

      {step === 3 && appealDraft && (
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 space-y-12 backdrop-blur-sm">
          {(appealDraft.benchmarkSummary || appealDraft.precedentNotes?.length || appealDraft.evidenceChecklist?.length) && (
            <div className="grid gap-6 lg:grid-cols-3">
              {appealDraft.benchmarkSummary && (
                <div className="rounded-[2rem] border border-black/8 bg-[#eadfce] p-6 text-[#1f1b17]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a5a49]">Database signal</p>
                  <p className="mt-4 text-base leading-7">{appealDraft.benchmarkSummary}</p>
                </div>
              )}
              {appealDraft.precedentNotes?.length ? (
                <div className="rounded-[2rem] border border-black/8 bg-white/75 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a5a49]">Observed precedents</p>
                  <div className="mt-4 space-y-3">
                    {appealDraft.precedentNotes.slice(0, 4).map((note) => (
                      <div key={note} className="rounded-[1.2rem] bg-[#f8f2ea] px-4 py-3 text-sm leading-6 text-[#574a40]">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {appealDraft.evidenceChecklist?.length ? (
                <div className="rounded-[2rem] border border-black/8 bg-white/75 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a5a49]">What to attach</p>
                  <div className="mt-4 space-y-3">
                    {appealDraft.evidenceChecklist.slice(0, 5).map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-[1.2rem] bg-[#f8f2ea] px-4 py-3 text-sm text-[#574a40]">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#b43c2e]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">Draft Appeal Letter</h4>
            <div className="p-10 bg-slate-900/80 border border-white/10 rounded-[2rem] font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-300 max-h-[500px] overflow-y-auto">
              <div className="font-bold mb-6 border-b border-white/10 pb-4 text-white">Subject: {appealDraft.subject}</div>
              {appealDraft.body}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-between pt-8">
            <Button variant="ghost" className="h-14 px-8 rounded-full text-slate-400" onClick={() => setStep(2)}>Back</Button>
            <div className="flex gap-4">
              <Button variant="outline" className="h-14 px-8 rounded-full border-white/10 text-white font-bold" onClick={copyToClipboard}>
                <Copy className="mr-3 h-5 w-5" />
                Copy Text
              </Button>
              <Button className="h-14 px-10 bg-white text-black hover:bg-slate-200 rounded-full font-bold shadow-xl" onClick={downloadPDF}>
                <Download className="mr-3 h-5 w-5" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
