import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { extractDenialData } from '@/src/lib/gemini';
import { ExtractionResult } from '@/src/types';
import { db, auth, ensureAnonymousSession, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Loader2, Upload, CheckCircle2, ChevronRight, ShieldCheck, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { saveUserSubmission } from '@/src/lib/observatoryRepository';
import { validateUploadFileMeta } from '@/src/lib/intakePipeline';
import { buildSeededStoryNarrative, mergeStoryExtraction } from '@/src/lib/storyIntake';
import { hasStorySignal } from '@/src/lib/storySubmission';
import { formatPublicStoryCount, PUBLIC_STORY_COUNT } from '@/src/lib/publicMetrics';

const STORY_SEED_KEY = 'fid_story_seed';
export const DEFAULT_STORY_CONSENT = {
  public: false,
  aggregated: true,
  research: false,
} as const;

export default function SubmitDenial() {
  const [step, setStep] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionRef, setRecognitionRef] = useState<any>(null);
  const [rawText, setRawText] = useState('');
  const [narrative, setNarrative] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [manualFields, setManualFields] = useState({
    insurer: '',
    planType: '',
    procedure: '',
    denialReason: '',
    date: '',
  });
  const [consent, setConsent] = useState(DEFAULT_STORY_CONSENT);
  const canContinueStory = hasStorySignal({
    narrative,
    rawText,
    uploadedFileUrl: null,
    manualFields,
    extractedData,
  });

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORY_SEED_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as { query?: string };
      const query = parsed?.query?.trim();
      if (!query) return;

      const hasExistingContent =
        Boolean(narrative.trim()) ||
        Boolean(rawText.trim()) ||
        Boolean(manualFields.insurer.trim()) ||
        Boolean(manualFields.planType.trim()) ||
        Boolean(manualFields.procedure.trim()) ||
        Boolean(manualFields.denialReason.trim());

      if (hasExistingContent) return;

      const seededNarrative = buildSeededStoryNarrative(query);
      setNarrative(seededNarrative);
      setRawText(seededNarrative);
      window.sessionStorage.removeItem(STORY_SEED_KEY);
      toast.success('We started your story from that search. Add whatever details matter most.');
    } catch (error) {
      console.error('Failed to seed story from homepage query', error);
    }
  }, [manualFields.denialReason, manualFields.insurer, manualFields.planType, manualFields.procedure, narrative, rawText]);

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
    const toastId = toast.loading('Reading your paperwork in this browser...');

    try {
      setUploadedFileName(file.name);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await extractDenialData('', { data: base64, mimeType: file.type });
          setExtractedData(result);
          setManualFields((prev) => ({
            insurer: result.insurer || prev.insurer,
            planType: result.planType || prev.planType,
            procedure: result.procedure || prev.procedure,
            denialReason: result.denialReason || prev.denialReason,
            date: result.date || prev.date,
          }));
          toast.success('Paperwork read. We did not store the raw file.', { id: toastId });
        } catch {
          toast.success('Paperwork attached. You can confirm the details manually.', { id: toastId });
        } finally {
          setIsExtracting(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast.error('Failed to read the file.', { id: toastId });
      setIsExtracting(false);
    }
  };

  const handleExtractFromText = async () => {
    if (!rawText.trim() && !narrative.trim()) {
      setStep(2);
      return;
    }

    setIsExtracting(true);
    const toastId = toast.loading('Structuring the story...');
    try {
      const result = await extractDenialData(rawText || narrative);
      setExtractedData(result);
      setManualFields((prev) => ({
        insurer: result.insurer || prev.insurer,
        planType: result.planType || prev.planType,
        procedure: result.procedure || prev.procedure,
        denialReason: result.denialReason || prev.denialReason,
        date: result.date || prev.date,
      }));
      toast.success('Story structured. You can confirm the details now.', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.success('We saved your story text. You can confirm the details manually.', { id: toastId });
    } finally {
      setIsExtracting(false);
      setStep(2);
    }
  };

  const startVoiceCapture = () => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      toast.error('Voice capture is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) transcript += event.results[i][0].transcript;
      setNarrative(transcript.trim());
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    setRecognitionRef(recognition);
    setIsRecording(true);
    toast.success('Listening. Tell us what happened.');
  };

  const stopVoiceCapture = () => {
    recognitionRef?.stop?.();
    setIsRecording(false);
  };

  const handleSaveAndFinish = async () => {
    if (!canContinueStory) {
      toast.error('Add at least a few details or paperwork first.');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving your story...');
    try {
      const currentUser = auth.currentUser || (await ensureAnonymousSession());
      const effectiveExtraction: ExtractionResult = mergeStoryExtraction({
        extractedData,
        manualFields,
        narrative,
        rawText,
      });

      await saveUserSubmission(db, {
        extractedData: effectiveExtraction,
        narrative: narrative || rawText,
        uploadedFileUrl: null,
        userId: currentUser.uid,
        consent,
      });

      setStep(3);
      toast.success('Submission saved successfully!', { id: toastId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'denials');
      toast.error('Failed to save submission.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fcfd_0%,#eef7fb_100%)] px-5 py-10 text-[#143047] md:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-6 border-b border-[#d7e7eb] pb-12">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-xl transition-all duration-500 ${
                  step === s ? 'bg-[#0f5ea8] text-white shadow-[0_0_28px_rgba(15,94,168,0.22)]' : 'border border-[#d7e7eb] bg-white text-[#6f91a0]'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">Share your story</p>
          <h1 className="text-5xl font-semibold tracking-[-0.06em] text-[#0e2b43] md:text-6xl">Share what happened. Help the record grow.</h1>
          <p className="max-w-3xl text-lg leading-8 text-[#557082]">
            Start private if you want. You choose what gets shared, and public stories are anonymized before they reach the searchable record.
          </p>
        </header>

        {step === 1 && (
          <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[2.5rem] border border-[#d7e7eb] bg-white p-8 shadow-[0_18px_50px_rgba(34,95,130,0.08)] md:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">Step 1</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#0e2b43]">Tell us what happened first.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#557082]">
                Start with the human story. What was denied, what did you need, what did the insurer say, and what changed for your care or bills?
              </p>

              <textarea
                className="mt-8 min-h-[300px] w-full rounded-[2rem] border border-[#d7e7eb] bg-[#f9fdff] p-6 text-sm font-light text-[#143047] outline-none transition-all focus:ring-2 focus:ring-[#0f5ea8]"
                placeholder="I have UnitedHealthcare Choice Plus and they denied Taltz even though my doctor says it is medically necessary..."
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
              />

              <div className="mt-6 rounded-[1.6rem] border border-[#d7e7eb] bg-[#f7fcfe] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">What helps most</p>
                <div className="mt-4 grid gap-3 text-sm leading-7 text-[#557082] sm:grid-cols-2">
                  <p>Who the insurer or plan was.</p>
                  <p>What care, drug, or test was denied.</p>
                  <p>What reason they gave you.</p>
                  <p>What happened after the denial.</p>
                </div>
                <p className="mt-4 text-sm leading-7 text-[#6b8797]">
                  Even a few details help us turn your experience into a record that is easier to search, compare, and use.
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-[#d7e7eb] bg-[#f9fdff] px-4 py-4 text-sm text-[#143047] outline-none focus:ring-2 focus:ring-[#0f5ea8]"
                  placeholder="Insurer, if you know it"
                  value={manualFields.insurer}
                  onChange={(e) => setManualFields((prev) => ({ ...prev, insurer: e.target.value }))}
                />
                <input
                  className="rounded-2xl border border-[#d7e7eb] bg-[#f9fdff] px-4 py-4 text-sm text-[#143047] outline-none focus:ring-2 focus:ring-[#0f5ea8]"
                  placeholder="Plan name or plan type"
                  value={manualFields.planType}
                  onChange={(e) => setManualFields((prev) => ({ ...prev, planType: e.target.value }))}
                />
                <input
                  className="rounded-2xl border border-[#d7e7eb] bg-[#f9fdff] px-4 py-4 text-sm text-[#143047] outline-none focus:ring-2 focus:ring-[#0f5ea8]"
                  placeholder="Procedure, drug, or service"
                  value={manualFields.procedure}
                  onChange={(e) => setManualFields((prev) => ({ ...prev, procedure: e.target.value }))}
                />
                <input
                  className="rounded-2xl border border-[#d7e7eb] bg-[#f9fdff] px-4 py-4 text-sm text-[#143047] outline-none focus:ring-2 focus:ring-[#0f5ea8]"
                  placeholder="Why they said no"
                  value={manualFields.denialReason}
                  onChange={(e) => setManualFields((prev) => ({ ...prev, denialReason: e.target.value }))}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {!isRecording ? (
                  <Button type="button" variant="outline" className="rounded-full border-[#d7e7eb] bg-white text-[#143047] hover:bg-[#f3fafc]" onClick={startVoiceCapture}>
                    <Mic className="mr-2 h-4 w-4" />
                    Tell it out loud
                  </Button>
                ) : (
                  <Button type="button" variant="outline" className="rounded-full border-[#d7e7eb] bg-[#f7fcfe] text-[#0f5ea8] hover:bg-[#eef8fb]" onClick={stopVoiceCapture}>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop recording
                  </Button>
                )}
                <Button className="h-14 rounded-[1rem] bg-[#0f5ea8] px-8 text-base font-semibold text-white shadow-xl shadow-[#0f5ea8]/20 hover:bg-[#0c4f8f]" onClick={handleExtractFromText} disabled={isExtracting || !canContinueStory}>
                  {isExtracting ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <ChevronRight className="mr-3 h-5 w-5" />}
                  Continue
                </Button>
              </div>
              {!canContinueStory ? (
                <p className="mt-4 text-sm leading-7 text-[#6b8797]">Add at least a few details or paperwork first.</p>
              ) : null}
            </div>

            <div className="space-y-6 rounded-[2.5rem] border border-[#d7e7eb] bg-white p-8 shadow-[0_18px_50px_rgba(34,95,130,0.08)] md:p-10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">Optional</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#0e2b43]">Read paperwork without storing it.</h2>
                <p className="mt-4 text-sm leading-7 text-[#557082]">
                  This helps us pull the exact denial reason faster. We do not save the uploaded denial letter; we only use it in this session to help extract structured fields.
                </p>
              </div>

              <div className="rounded-[2rem] border-2 border-dashed border-[#d7e7eb] bg-[#f9fdff] p-10 text-center transition-all hover:border-[#9dd2de] hover:bg-[#f3fafc]" onClick={() => document.getElementById('file-upload')?.click()}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0f5ea8] shadow-2xl shadow-[#0f5ea8]/20">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <p className="mt-6 text-lg font-semibold text-[#0e2b43]">Upload denial evidence</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-[#6f91a0]">PDF, JPG, PNG</p>
                <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
              </div>
              {uploadedFileName ? (
                <p className="rounded-[1rem] border border-[#d7e7eb] bg-[#f7fcfe] px-4 py-3 text-sm leading-7 text-[#557082]">
                  Read locally: {uploadedFileName}. We do not save the uploaded denial letter.
                </p>
              ) : null}

              <textarea
                className="min-h-[180px] w-full rounded-[1.5rem] border border-[#d7e7eb] bg-[#f9fdff] p-4 text-sm font-light text-[#143047] outline-none transition-all focus:ring-2 focus:ring-[#0f5ea8]"
                placeholder="Paste any denial letter or explanation of benefits language here and we'll pull out the key details."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />

              <div className="rounded-[1.6rem] border border-[#d7e7eb] bg-[#f7fcfe] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">Why this matters</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[#557082]">
                  <p>Story-first intake helps us collect real experiences, not just paperwork fragments.</p>
                  <p>Optional uploads are read for extraction only. The saved record is structured fields plus your consent choices, not the raw denial letter.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-[2rem] border border-[#d7e7eb] bg-white px-6 py-5 text-center shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
          <p className="text-sm leading-7 text-[#557082]">
            {formatPublicStoryCount(PUBLIC_STORY_COUNT)} stories already published. Yours will be anonymized before it goes public.
          </p>
        </section>

        {step === 2 && (
          <section className="rounded-[2.5rem] border border-[#d7e7eb] bg-white p-8 shadow-[0_18px_50px_rgba(34,95,130,0.08)] md:p-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">Step 2</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#0e2b43]">Check what we pulled out.</h2>
            <p className="mt-4 text-sm leading-7 text-[#557082]">
              Fix anything that is wrong. These fields stay editable so the record reflects what actually happened.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {[
                ['Insurer', manualFields.insurer || extractedData?.insurer || '', 'insurer'],
                ['Plan', manualFields.planType || extractedData?.planType || '', 'planType'],
                ['Procedure / drug / service', manualFields.procedure || extractedData?.procedure || '', 'procedure'],
                ['Denial reason', manualFields.denialReason || extractedData?.denialReason || '', 'denialReason'],
                ['Date', manualFields.date || extractedData?.date || '', 'date'],
              ].map(([label, value, key]) => (
                <div key={String(key)} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f91a0]">{label}</label>
                  <input
                    className="w-full rounded-2xl border border-[#d7e7eb] bg-[#f9fdff] p-5 font-medium text-[#143047] outline-none focus:ring-2 focus:ring-[#0f5ea8]"
                    value={String(value)}
                    onChange={(event) => setManualFields((prev) => ({ ...prev, [key]: event.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f91a0]">Your story</label>
              <textarea
                className="min-h-[170px] w-full rounded-2xl border border-[#d7e7eb] bg-[#f9fdff] p-6 font-light text-[#143047] outline-none focus:ring-2 focus:ring-[#0f5ea8]"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
              />
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                ['Public story', consent.public, 'Share an anonymized version publicly so other patients can find it.'],
                ['Aggregated data', consent.aggregated, 'Use this case in the statistics and pattern analysis even if the full story stays private.'],
                ['Research access', consent.research, 'Allow anonymized use in deeper advocacy and reporting work.'],
              ].map(([label, checked, help], index) => (
                <label key={String(label)} className="flex cursor-pointer flex-col gap-4 rounded-[1.5rem] border border-[#d7e7eb] bg-[#f9fdff] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0e2b43]">{label}</p>
                    <input
                      type="checkbox"
                      checked={Boolean(checked)}
                      onChange={(e) =>
                        setConsent((prev) => ({
                          ...prev,
                          [index === 0 ? 'public' : index === 1 ? 'aggregated' : 'research']: e.target.checked,
                        }))
                      }
                      className="h-5 w-5 rounded border-[#d7e7eb] bg-white checked:bg-[#0f5ea8]"
                    />
                  </div>
                  <p className="text-sm leading-7 text-[#557082]">{help}</p>
                </label>
              ))}
            </div>

            <div className="mt-10 flex justify-between">
              <Button variant="outline" className="h-14 rounded-[1rem] border-[#d7e7eb] bg-white px-8 text-[#143047] hover:bg-[#f3fafc]" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="h-14 rounded-[1rem] bg-[#0f5ea8] px-8 text-base font-semibold text-white hover:bg-[#0c4f8f]" onClick={handleSaveAndFinish} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-3 h-5 w-5" />}
                Submit story
              </Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="rounded-[2.7rem] border border-[#d7e7eb] bg-white p-16 text-center shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#eef8fb]">
                <CheckCircle2 className="h-12 w-12 text-[#0f5ea8]" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">Story saved</p>
              <h2 className="text-5xl font-semibold tracking-[-0.06em] text-[#0e2b43]">Thank you for adding to the record.</h2>
              <p className="text-lg leading-8 text-[#557082]">
                Your story now helps other patients find patterns, proof, and a clear place to start.
              </p>
              <Button
                size="lg"
                className="mt-6 h-16 rounded-[1rem] bg-[#0f5ea8] px-12 text-lg font-semibold text-white hover:bg-[#0c4f8f]"
                onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'home' }))}
              >
                Return to the database
              </Button>
            </div>
          </section>
        )}

        <div className="flex items-center justify-center gap-4 rounded-3xl border border-[#d7e7eb] bg-white p-6 text-[10px] font-bold uppercase tracking-[0.3em] text-[#6f91a0] shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
          <ShieldCheck className="h-5 w-5 text-[#0f5ea8]" />
          We do not store uploaded denial letters. Public stories are anonymized before they reach the searchable database.
        </div>
      </div>
    </div>
  );
}
