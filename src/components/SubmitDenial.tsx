import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { extractDenialData } from "@/src/lib/gemini";
import { ExtractionResult } from "@/src/types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db, auth, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { Loader2, Upload, CheckCircle2, ChevronRight, ShieldCheck, Mic, MicOff } from 'lucide-react';
import { toast } from "sonner";
import { saveUserSubmission } from "@/src/lib/observatoryRepository";
import { validateUploadFileMeta } from "@/src/lib/intakePipeline";

export default function SubmitDenial() {
  const [step, setStep] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionRef, setRecognitionRef] = useState<any>(null);
  const [rawText, setRawText] = useState("");
  const [narrative, setNarrative] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadReady, setUploadReady] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [manualFields, setManualFields] = useState({
    insurer: '',
    procedure: '',
    denialReason: '',
    date: '',
  });
  const [consent, setConsent] = useState({
    public: true,
    aggregated: true,
    research: true,
  });

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
    const toastId = toast.loading("Uploading and reading your paperwork...");
    try {
      if (auth.currentUser) {
        const storageRef = ref(storage, `denials/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(uploadResult.ref);
        setUploadedFileUrl(url);
      }

      setUploadReady(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await extractDenialData("", { data: base64, mimeType: file.type });
          setExtractedData(result);
          setManualFields((prev) => ({
            insurer: result.insurer || prev.insurer,
            procedure: result.procedure || prev.procedure,
            denialReason: result.denialReason || prev.denialReason,
            date: result.date || prev.date,
          }));
          toast.success("Paperwork analyzed. You can confirm the details next.", { id: toastId });
        } catch {
          toast.success("Paperwork attached. You can confirm the details manually.", { id: toastId });
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload or read the file.", { id: toastId });
      setIsExtracting(false);
    }
  };

  const handleExtractFromText = async () => {
    if (!rawText.trim()) {
      setStep(2);
      return;
    }

    setIsExtracting(true);
    const toastId = toast.loading("Structuring the story...");
    try {
      const result = await extractDenialData(rawText);
      setExtractedData(result);
      setManualFields((prev) => ({
        insurer: result.insurer || prev.insurer,
        procedure: result.procedure || prev.procedure,
        denialReason: result.denialReason || prev.denialReason,
        date: result.date || prev.date,
      }));
      toast.success("Story structured. You can confirm the details now.", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.success("We saved your story text. You can confirm the details manually.", { id: toastId });
    } finally {
      setIsExtracting(false);
      setStep(2);
    }
  };

  const startVoiceCapture = () => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      toast.error("Voice capture is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setNarrative(transcript.trim());
    };

    recognition.onend = () => setIsRecording(false);

    recognition.start();
    setRecognitionRef(recognition);
    setIsRecording(true);
    toast.success("Listening. Tell us what happened.");
  };

  const stopVoiceCapture = () => {
    recognitionRef?.stop?.();
    setIsRecording(false);
  };

  const handleContinue = async () => {
    if (!narrative.trim() && !rawText.trim() && !uploadReady) {
      toast.error("Start by telling us what happened.");
      return;
    }
    await handleExtractFromText();
  };

  const handleSaveAndFinish = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Saving your story...");
    try {
      const effectiveExtraction: ExtractionResult = extractedData || {
        insurer: manualFields.insurer || "Unknown",
        planType: "Unknown",
        procedure: manualFields.procedure || "Medical Service",
        denialReason: manualFields.denialReason || "Coverage Denial",
        denialQuote: "",
        appealDeadline: "",
        isERISA: "Unknown",
        medicalNecessityFlag: false,
        imeInvolved: false,
        summary: (narrative || rawText).slice(0, 280),
        date: manualFields.date || new Date().toISOString().slice(0, 10),
        cptCodes: [],
      };

      await saveUserSubmission(db, {
        extractedData: effectiveExtraction,
        narrative: narrative || rawText,
        uploadedFileUrl,
        userId: auth.currentUser?.uid || null,
        consent,
      });

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
    <div className="min-h-screen bg-[#f4efe8] px-5 py-10 md:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="space-y-6 border-b border-black/10 pb-12">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl font-bold text-xl transition-all duration-500 ${step === s ? 'bg-[#b43c2e] text-white shadow-[0_0_20px_rgba(180,60,46,0.25)]' : 'border border-black/8 bg-white/70 text-[#8b7d70]'}`}
              >
                {s}
              </div>
            ))}
          </div>
          <h1 className="text-6xl font-bold tracking-tighter text-[#1f1b17]">Share Your Story.</h1>
          <p className="max-w-3xl text-xl font-light text-[#574a40]">
            Tell us what happened in your own words first. Then we’ll help structure the details so your story can help other patients spot patterns, precedents, and what worked.
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="rounded-[3rem] border border-black/8 bg-white/80 p-12 space-y-12 backdrop-blur-sm">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-[#1f1b17]">Start with the part no insurer sees</h2>
                <p className="font-light text-[#574a40]">
                  Let it out first. Type it or speak it. If you have the denial letter, EOB, or claim notice, you can add that too, but it is optional on this page.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  <textarea
                    className="min-h-[280px] w-full rounded-[2rem] border border-black/10 bg-[#f8f2ea] p-6 text-sm font-light text-[#1f1b17] outline-none transition-all focus:ring-2 focus:ring-[#b43c2e]"
                    placeholder="What was denied? What did you need? What did the insurer say? What happened to your health, money, stress level, or treatment timeline?"
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      className="rounded-2xl border border-black/10 bg-[#f8f2ea] px-4 py-4 text-sm text-[#1f1b17] outline-none focus:ring-2 focus:ring-[#b43c2e]"
                      placeholder="Insurer, if you know it"
                      value={manualFields.insurer}
                      onChange={(e) => setManualFields((prev) => ({ ...prev, insurer: e.target.value }))}
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-[#f8f2ea] px-4 py-4 text-sm text-[#1f1b17] outline-none focus:ring-2 focus:ring-[#b43c2e]"
                      placeholder="Procedure, drug, or service"
                      value={manualFields.procedure}
                      onChange={(e) => setManualFields((prev) => ({ ...prev, procedure: e.target.value }))}
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-[#f8f2ea] px-4 py-4 text-sm text-[#1f1b17] outline-none focus:ring-2 focus:ring-[#b43c2e]"
                      placeholder="Why they said no"
                      value={manualFields.denialReason}
                      onChange={(e) => setManualFields((prev) => ({ ...prev, denialReason: e.target.value }))}
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-[#f8f2ea] px-4 py-4 text-sm text-[#1f1b17] outline-none focus:ring-2 focus:ring-[#b43c2e]"
                      placeholder="Date, if you know it"
                      value={manualFields.date}
                      onChange={(e) => setManualFields((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {!isRecording ? (
                      <Button type="button" variant="outline" className="rounded-full border-black/10 bg-white/80" onClick={startVoiceCapture}>
                        <Mic className="mr-2 h-4 w-4" />
                        Record by voice
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" className="rounded-full border-[#b43c2e]/20 bg-[#fff6ef] text-[#b43c2e]" onClick={stopVoiceCapture}>
                        <MicOff className="mr-2 h-4 w-4" />
                        Stop recording
                      </Button>
                    )}
                    <Button className="group h-14 rounded-full bg-[#1f1b17] px-8 text-base font-bold text-white shadow-xl shadow-black/10 hover:bg-[#2a231d]" onClick={handleContinue} disabled={isExtracting}>
                      {isExtracting ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <ChevronRight className="mr-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />}
                      Continue
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 rounded-[2rem] border border-black/8 bg-[#fff6ef] p-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b7d70]">Optional paperwork</p>
                    <h3 className="text-2xl font-bold text-[#1f1b17]">Add the denial letter if you have it</h3>
                    <p className="text-sm leading-relaxed text-[#574a40]">
                      Uploading a denial letter or EOB helps us structure the case faster, but it is not required to share the story.
                    </p>
                  </div>
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center space-y-6 rounded-[2rem] border-2 border-dashed border-[#b43c2e]/25 bg-white p-10 transition-all duration-500 hover:border-[#b43c2e]/45 hover:bg-[#fffaf6]"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#b43c2e] shadow-2xl shadow-[#b43c2e]/20">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-bold text-[#1f1b17]">Upload denial evidence</p>
                      <p className="text-xs font-medium uppercase tracking-widest text-[#8b7d70]">PDF, JPG, PNG</p>
                    </div>
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
                  </div>

                  <textarea
                    className="min-h-[140px] w-full rounded-[1.5rem] border border-black/10 bg-white p-4 text-sm font-light text-[#1f1b17] outline-none transition-all focus:ring-2 focus:ring-[#b43c2e]"
                    placeholder="If you want, paste any denial or EOB language here and we’ll try to structure it."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 rounded-3xl border border-black/8 bg-white/75 p-6 text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b7d70]">
              <ShieldCheck className="w-5 h-5 text-[#b43c2e]" />
              Public stories should be anonymized before they reach the observatory.
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="rounded-[3rem] border border-black/8 bg-white/80 p-12 space-y-12 backdrop-blur-sm">
              <h3 className="border-b border-black/8 pb-6 text-3xl font-bold text-[#1f1b17]">Confirm the story details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { label: "Insurer", value: extractedData?.insurer || manualFields.insurer || "Unknown / not provided" },
                  { label: "Procedure", value: extractedData?.procedure || manualFields.procedure || "Medical Service / medication" },
                  { label: "Denial Reason", value: extractedData?.denialReason || manualFields.denialReason || "Coverage Denial" },
                  { label: "Date", value: extractedData?.date || manualFields.date || "Not provided" },
                  { label: "Upload attached", value: uploadReady ? "Yes" : "No" },
                ].map((field, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b7d70]">{field.label}</label>
                    <div className="rounded-2xl border border-black/8 bg-[#f8f2ea] p-5 font-bold text-[#1f1b17]">{field.value}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <label className="text-xl font-bold text-[#1f1b17]">Your story</label>
                <textarea
                  className="min-h-[150px] w-full rounded-2xl border border-black/10 bg-[#f8f2ea] p-6 font-light text-[#1f1b17] outline-none focus:ring-2 focus:ring-[#b43c2e]"
                  placeholder="What happened? How did the denial affect your health, care, finances, or stress level?"
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                />
              </div>

              <div className="space-y-8 border-t border-black/8 pt-8">
                <h3 className="text-xl font-bold tracking-tight text-[#1f1b17]">Consent & privacy</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <label className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-black/8 bg-[#f8f2ea] p-6 transition-colors hover:bg-[#f4eadf]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#1f1b17]">Public story</p>
                      <input type="checkbox" checked={consent.public} onChange={(e) => setConsent(prev => ({ ...prev, public: e.target.checked }))} className="h-5 w-5 rounded border-black/20 bg-white checked:bg-[#b43c2e]" />
                    </div>
                    <p className="text-[10px] font-light leading-relaxed text-[#7a6859]">Share an anonymized version of this story in the public observatory.</p>
                  </label>
                  <label className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-black/8 bg-[#f8f2ea] p-6 transition-colors hover:bg-[#f4eadf]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#1f1b17]">Aggregated data</p>
                      <input type="checkbox" checked={consent.aggregated} onChange={(e) => setConsent(prev => ({ ...prev, aggregated: e.target.checked }))} className="h-5 w-5 rounded border-black/20 bg-white checked:bg-[#b43c2e]" />
                    </div>
                    <p className="text-[10px] font-light leading-relaxed text-[#7a6859]">Include this case in benchmark and trend reporting even if the full story stays private.</p>
                  </label>
                  <label className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-black/8 bg-[#f8f2ea] p-6 transition-colors hover:bg-[#f4eadf]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#1f1b17]">Research access</p>
                      <input type="checkbox" checked={consent.research} onChange={(e) => setConsent(prev => ({ ...prev, research: e.target.checked }))} className="h-5 w-5 rounded border-black/20 bg-white checked:bg-[#b43c2e]" />
                    </div>
                    <p className="text-[10px] font-light leading-relaxed text-[#7a6859]">Allow verified researchers to use anonymized data in deeper reporting and public-interest work.</p>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <Button variant="outline" className="h-16 rounded-full border-black/10 bg-white/70 px-10 font-bold text-[#1f1b17]" onClick={() => setStep(1)}>Back</Button>
                <Button className="h-16 rounded-full bg-[#b43c2e] px-10 text-lg font-bold text-white shadow-xl shadow-[#b43c2e]/20 hover:bg-[#9f3226]" onClick={handleSaveAndFinish} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-3 h-5 w-5" />}
                  Submit Story
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="relative overflow-hidden rounded-[3rem] bg-[#1d1714] p-16 text-center text-white space-y-12">
              <ShieldCheck className="absolute -top-20 -right-20 w-80 h-80 opacity-10" />
              <div className="space-y-6 relative z-10">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-6xl font-bold tracking-tighter">Story Submitted.</h2>
                <p className="mx-auto max-w-2xl text-2xl font-light text-white/76">
                  Thank you for adding your denial to the record. Your story now helps other patients find patterns, precedents, and proof that they are not alone.
                </p>
              </div>

              <div className="pt-8 relative z-10">
                <Button
                  size="lg"
                  className="h-20 rounded-full bg-[#b43c2e] px-16 text-xl font-bold text-white shadow-2xl hover:bg-[#9f3226]"
                  onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'home' }))}
                >
                  Return to Observatory
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
