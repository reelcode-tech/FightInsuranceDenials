import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { extractDenialData, generateAppealLetter } from "@/src/lib/gemini";
import { ExtractionResult, DenialRecord, AppealDraft } from "@/src/types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db, auth, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { Loader2, Upload, FileText, CheckCircle2, ChevronRight, AlertCircle, Mail, FileUp, MessageSquare, ShieldCheck } from 'lucide-react';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { jsPDF } from "jspdf";

export default function SubmitDenial() {
  const [step, setStep] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [rawText, setRawText] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [narrative, setNarrative] = useState("");
  const [appealDraft, setAppealDraft] = useState<AppealDraft | null>(null);
  const [isGeneratingAppeal, setIsGeneratingAppeal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [similarCasesCount, setSimilarCasesCount] = useState<number | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState({
    public: true,
    aggregated: true,
    research: true
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const toastId = toast.loading("Uploading and analyzing document...");
    try {
      // Upload to Storage if logged in
      if (auth.currentUser) {
        const storageRef = ref(storage, `denials/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(uploadResult.ref);
        setUploadedFileUrl(url);
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await extractDenialData("", { data: base64, mimeType: file.type });
          setExtractedData(result);
          setStep(2);
          toast.success("Document analyzed successfully!", { id: toastId });
        } catch (err) {
          toast.error("Failed to analyze document. Please try again.", { id: toastId });
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload/analyze file.", { id: toastId });
      setIsExtracting(false);
    }
  };

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    const toastId = toast.loading("Analyzing text with AI...");
    try {
      const result = await extractDenialData(rawText);
      setExtractedData(result);
      setStep(2);
      toast.success("Data extracted successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to extract data. Please try again.", { id: toastId });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateAppeal = async () => {
    if (!extractedData) return;
    setIsGeneratingAppeal(true);
    try {
      const denial: DenialRecord = {
        id: "temp",
        ...extractedData,
        narrative,
        status: 'denied',
        tags: [],
        isPublic: true,
        createdAt: new Date().toISOString()
      };
      const draft = await generateAppealLetter(denial);
      setAppealDraft(draft);
      setStep(3);
      toast.success("Appeal letter generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate appeal. Please try again.");
    } finally {
      setIsGeneratingAppeal(false);
    }
  };

  const handleSaveAndFinish = async () => {
    if (!extractedData) return;
    setIsSaving(true);
    const toastId = toast.loading("Saving your story...");
    try {
      const denialData = {
        ...extractedData,
        insurer: extractedData.insurer || "Private Carrier",
        procedure: extractedData.procedure || "Medical Service",
        denialReason: extractedData.denialReason || "Coverage Denial",
        summary: extractedData.summary || `User story regarding ${extractedData.insurer || 'insurance'} denial.`,
        narrative,
        status: 'denied',
        tags: ['user-submission'],
        isPublic: consent.public,
        consentResearch: consent.research,
        source: 'User Submission',
        userId: auth.currentUser?.uid || null,
        fileUrl: uploadedFileUrl,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "denials"), denialData);
      
      setStep(3);
      toast.success("Submission saved successfully!", { id: toastId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "denials");
      toast.error("Failed to save submission.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12 bg-[#0A0A0B] min-h-screen text-slate-200">
      <div className="space-y-6 border-b border-white/10 pb-12">
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`w-12 h-12 flex items-center justify-center font-bold text-xl rounded-2xl transition-all duration-500 ${step === s ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-white/5 text-slate-500 border border-white/5'}`}
            >
              {s}
            </div>
          ))}
        </div>
        <h1 className="text-6xl font-bold tracking-tighter text-white">Share Your Story.</h1>
        <p className="text-xl font-light text-slate-400">Your data is a weapon. Help us build the public record of insurance rejections.</p>
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white/5 border border-white/5 rounded-[3rem] p-12 space-y-12 backdrop-blur-sm">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Submit Your Denial</h2>
              <p className="text-slate-400 font-light">Drop a file, paste text, or describe what happened. Our AI will handle the rest.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div 
                className="bg-blue-600/5 border-2 border-dashed border-blue-500/20 rounded-[2rem] p-12 flex flex-col items-center justify-center space-y-6 cursor-pointer group hover:bg-blue-600/10 hover:border-blue-500/40 transition-all duration-500"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-900/40 group-hover:scale-110 transition-transform duration-500">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-bold text-white">Upload Document</p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">PDF, JPG, PNG (Letters, EOBs)</p>
                </div>
                <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
              </div>

              <div className="space-y-6">
                <textarea
                  className="min-h-[250px] w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm font-light text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Or paste the text from your denial letter here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                <Button className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xl font-bold shadow-xl shadow-blue-900/20 group" onClick={handleExtract} disabled={isExtracting || !rawText.trim()}>
                  {isExtracting ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <ChevronRight className="mr-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />}
                  Analyze Story
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 p-6 rounded-3xl border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            HIPAA-ADJACENT SECURITY: YOUR PHI IS NEVER STORED IN PUBLIC VIEWS.
          </div>
        </div>
      )}

      {step === 2 && extractedData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white/5 border border-white/5 rounded-[3rem] p-12 space-y-12 backdrop-blur-sm">
            <h3 className="text-3xl font-bold text-white border-b border-white/10 pb-6">Confirm Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: "Insurer", value: extractedData.insurer || "Private Carrier" },
                { label: "Procedure", value: extractedData.procedure || "Medical Service" },
                { label: "Denial Reason", value: extractedData.denialReason || "Coverage Denial" },
                { label: "Date", value: extractedData.date || "Not found" },
                { label: "ERISA Status", value: extractedData.isERISA || "Unknown" }
              ].map((field, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em]">{field.label}</label>
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-white">{field.value}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <label className="text-xl font-bold text-white">Add Personal Context</label>
              <textarea
                className="min-h-[150px] w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-light text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="How has this affected your health or life? This helps us build a stronger case for systemic change."
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
              />
            </div>

            <div className="space-y-8 pt-8 border-t border-white/10">
              <h3 className="text-xl font-bold text-white tracking-tight">Consent & Privacy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <label className="flex flex-col gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer group hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-xs uppercase tracking-wide">Public Story</p>
                    <input type="checkbox" checked={consent.public} onChange={(e) => setConsent(prev => ({ ...prev, public: e.target.checked }))} className="w-5 h-5 bg-slate-900 border-white/20 rounded checked:bg-blue-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-light leading-relaxed">Share anonymized story in the public observatory.</p>
                </label>
                <label className="flex flex-col gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer group hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-xs uppercase tracking-wide">Aggregated Data</p>
                    <input type="checkbox" checked={consent.aggregated} onChange={(e) => setConsent(prev => ({ ...prev, aggregated: e.target.checked }))} className="w-5 h-5 bg-slate-900 border-white/20 rounded checked:bg-blue-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-light leading-relaxed">Include in high-level trend reports and benchmarks.</p>
                </label>
                <label className="flex flex-col gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer group hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-xs uppercase tracking-wide">Research Access</p>
                    <input type="checkbox" checked={consent.research} onChange={(e) => setConsent(prev => ({ ...prev, research: e.target.checked }))} className="w-5 h-5 bg-slate-900 border-white/20 rounded checked:bg-blue-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-light leading-relaxed">Allow verified researchers to access anonymized data.</p>
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-8">
              <Button className="h-16 px-10 rounded-full border-white/10 hover:bg-white/5 text-white font-bold" onClick={() => setStep(1)}>Back</Button>
              <Button className="h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-bold shadow-xl shadow-blue-900/20" onClick={handleSaveAndFinish} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-3 h-5 w-5" />}
                Submit Story
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="bg-blue-600 rounded-[3rem] p-16 text-white space-y-12 text-center relative overflow-hidden">
            <ShieldCheck className="absolute -top-20 -right-20 w-80 h-80 opacity-10" />
            <div className="space-y-6 relative z-10">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-6xl font-bold tracking-tighter">Story Submitted.</h2>
              <p className="text-2xl font-light text-blue-100 max-w-2xl mx-auto">
                Thank you for contributing to the public record. Your data is now part of the collective fight against unfair denials.
              </p>
            </div>

            <div className="pt-8 relative z-10">
              <Button 
                size="lg" 
                className="h-20 px-16 bg-white text-blue-600 hover:bg-blue-50 rounded-full text-xl font-bold shadow-2xl"
                onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'home' }))}
              >
                Return to Observatory
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
