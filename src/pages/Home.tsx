import { useState, useRef, useCallback } from 'react';
import {
  FileText,
  X,
  Download,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FileUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { extractTextFromPDF } from '@/lib/pdfExtractor';
import { generateCommentary } from '@/lib/aiService';
import { generateCommentaryPDF, downloadPDF } from '@/lib/pdfGenerator';
import type { CommentaryData } from '@/types';

type AppStep = 'idle' | 'upload' | 'extracting' | 'generating' | 'preview';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>('idle');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [commentary, setCommentary] = useState<CommentaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('border-teal-600', 'bg-teal-50');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-teal-600', 'bg-teal-50');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-teal-600', 'bg-teal-50');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFile(files[0]);
  };

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file only.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File size must be less than 10MB.'); return; }
    setError(null);
    setUploadedFile(file);
    setCurrentStep('upload');
    await processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      setCurrentStep('extracting');
      setProgressMessage('Reading your factsheet...');
      const extractedText = await extractTextFromPDF(file);
      if (!extractedText || extractedText.length < 100) {
        throw new Error('Could not extract sufficient text from the PDF. The file may be scanned/image-based.');
      }
      setCurrentStep('generating');
      setProgressMessage('Analyzing and writing commentary...');
      const data = await generateCommentary(extractedText);
      setCommentary(data);
      setProgressMessage('Formatting your PDF...');
      const url = await generateCommentaryPDF(data);
      setPdfUrl(url);
      setCurrentStep('preview');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setCurrentStep('idle');
      setUploadedFile(null);
    }
  };

  const handleDownload = () => {
    if (pdfUrl && commentary) {
      const safeFundName = (commentary.fundInfo.fundName || 'fund').replace(/\s+/g, '_').toLowerCase();
      const filename = `${safeFundName}_commentary_${commentary.quarter || ''}_${commentary.year || ''}.pdf`;
      downloadPDF(pdfUrl, filename);
    }
  };

  const handleReset = () => {
    setCurrentStep('idle');
    setUploadedFile(null);
    setCommentary(null);
    setError(null);
    setPdfUrl(null);
    setExpandedSection(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-700 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">FundFacts AI</h1>
              <p className="text-[11px] text-gray-500 -mt-0.5">Manager Commentary Generator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1"><p className="text-sm text-red-700">{error}</p></div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {(currentStep === 'idle' || currentStep === 'upload') && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Turn Factsheets into<span className="text-teal-700"> Manager Commentary</span>
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto text-sm leading-relaxed">
                Upload any mutual fund or ETF factsheet PDF and our AI will generate a clear,
                jargon-free manager commentary that anyone can understand — in under a minute.
              </p>
            </div>

            <Card className="border-2 border-dashed border-gray-300 hover:border-teal-500 transition-all duration-300 shadow-sm hover:shadow-md bg-white">
              <CardContent className="p-0">
                <div ref={dropZoneRef} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center py-14 px-6 cursor-pointer transition-all duration-200 rounded-lg"
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelect} className="hidden" />
                  <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-5">
                    <FileUp className="w-8 h-8 text-teal-700" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1">Drop your factsheet PDF here</p>
                  <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Badge variant="secondary" className="font-normal">PDF only</Badge>
                    <Badge variant="secondary" className="font-normal">Max 10MB</Badge>
                    <Badge variant="secondary" className="font-normal">Quarterly / Monthly</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              {[
                { icon: Sparkles, title: 'AI-Powered', desc: 'Advanced AI reads and understands your entire factsheet' },
                { icon: FileText, title: 'One-Page Output', desc: 'Clean, formatted commentary that fits on a single page' },
                { icon: TrendingUp, title: 'Simple Language', desc: 'No jargon — written for everyday investors' },
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                  <feature.icon className="w-6 h-6 text-teal-700 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">How It Works</h3>
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  { step: '1', label: 'Upload Factsheet', desc: 'Drop any fund factsheet PDF' },
                  { step: '2', label: 'AI Analysis', desc: 'Our AI reads every section' },
                  { step: '3', label: 'Generate Commentary', desc: 'Clear, simple language output' },
                  { step: '4', label: 'Download PDF', desc: 'One-page formatted report' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-teal-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    {i < 3 && <ArrowRight className="w-4 h-4 text-gray-300 hidden sm:block shrink-0 mt-1" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(currentStep === 'extracting' || currentStep === 'generating') && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center max-w-md w-full">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-teal-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
                <Loader2 className="w-6 h-6 text-teal-700 absolute inset-0 m-auto animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {currentStep === 'extracting' ? 'Reading Factsheet' : 'Writing Commentary'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{progressMessage}</p>
              {uploadedFile && (
                <div className="bg-gray-50 rounded-lg px-4 py-2.5 flex items-center gap-3 text-left">
                  <FileText className="w-5 h-5 text-teal-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-400">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyzing with AI...</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'preview' && commentary && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white rounded-xl px-6 py-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Commentary Ready</h3>
                  <p className="text-xs text-gray-500">{commentary.fundInfo.fundName} — {commentary.quarter} {commentary.year}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset} className="text-gray-600">
                  <FileUp className="w-4 h-4 mr-2" />New Upload
                </Button>
                <Button size="sm" onClick={handleDownload} className="bg-teal-700 hover:bg-teal-800 text-white">
                  <Download className="w-4 h-4 mr-2" />Download PDF
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-teal-700 px-6 py-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.15em] opacity-80">Fund Manager Commentary</span>
                  <Badge className="bg-white/20 text-white border-0 text-[10px]">{commentary.fundInfo.fundCategory}</Badge>
                </div>
                <h2 className="text-xl font-bold mb-1">{commentary.fundInfo.fundName}</h2>
                <p className="text-xs opacity-80">{commentary.fundInfo.amcName} &nbsp;|&nbsp; {commentary.quarter} {commentary.year}</p>
                <div className="flex gap-6 mt-4 pt-3 border-t border-white/20">
                  <div><p className="text-[10px] opacity-60 uppercase">Benchmark</p><p className="text-xs font-semibold">{commentary.fundInfo.benchmark}</p></div>
                  <div><p className="text-[10px] opacity-60 uppercase">AUM</p><p className="text-xs font-semibold">{commentary.fundInfo.aum}</p></div>
                  <div><p className="text-[10px] opacity-60 uppercase">Expense Ratio</p><p className="text-xs font-semibold">{commentary.fundInfo.expenseRatio || 'N/A'}</p></div>
                  <div><p className="text-[10px] opacity-60 uppercase">Risk</p><p className="text-xs font-semibold">{commentary.fundInfo.riskProfile}</p></div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <button onClick={() => toggleSection('manager')} className="flex items-center justify-between w-full text-left group">
                    <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wide border-b border-gray-200 pb-1 flex-1">Fund Manager Team</h4>
                    {expandedSection === 'manager' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  <p className="text-sm text-gray-700 leading-relaxed mt-2">{commentary.fundManagerTeam}</p>
                </div>

                <div>
                  <button onClick={() => toggleSection('strategy')} className="flex items-center justify-between w-full text-left group">
                    <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wide border-b border-gray-200 pb-1 flex-1">Strategy</h4>
                    {expandedSection === 'strategy' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  <p className="text-sm text-gray-700 leading-relaxed mt-2">{commentary.strategy}</p>
                </div>

                <div>
                  <button onClick={() => toggleSection('performance')} className="flex items-center justify-between w-full text-left group">
                    <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wide border-b border-gray-200 pb-1 flex-1">Performance Attribution</h4>
                    {expandedSection === 'performance' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  <p className="text-sm text-gray-700 leading-relaxed mt-2 mb-3">{commentary.performanceAttribution.summary}</p>

                  <div className="bg-emerald-50 border-l-3 border-emerald-500 rounded-r-lg p-3.5 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Top Performers</span>
                    </div>
                    <div className="space-y-2.5">
                      {commentary.performanceAttribution.topPerformers.map((performer, i) => (
                        <div key={i}>
                          <p className="text-sm font-semibold text-gray-900">{performer.name}</p>
                          {performer.specifics && <p className="text-xs text-emerald-600 italic">{performer.specifics}</p>}
                          <p className="text-xs text-gray-600 leading-relaxed"><strong>{performer.contribution}</strong> — {performer.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-red-50 border-l-3 border-red-500 rounded-r-lg p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Bottom Performers</span>
                    </div>
                    <div className="space-y-2.5">
                      {commentary.performanceAttribution.bottomPerformers.map((performer, i) => (
                        <div key={i}>
                          <p className="text-sm font-semibold text-gray-900">{performer.name}</p>
                          {performer.specifics && <p className="text-xs text-red-600 italic">{performer.specifics}</p>}
                          <p className="text-xs text-gray-600 leading-relaxed"><strong>{performer.contribution}</strong> — {performer.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <button onClick={() => toggleSection('benchmark')} className="flex items-center justify-between w-full text-left group">
                    <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wide border-b border-gray-200 pb-1 flex-1">Benchmark Comparison</h4>
                    {expandedSection === 'benchmark' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  <p className="text-sm text-gray-700 leading-relaxed mt-2">{commentary.benchmarkComparison}</p>
                </div>

                <div>
                  <button onClick={() => toggleSection('outlook')} className="flex items-center justify-between w-full text-left group">
                    <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wide border-b border-gray-200 pb-1 flex-1">Outlook</h4>
                    {expandedSection === 'outlook' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  <p className="text-sm text-gray-700 leading-relaxed mt-2">{commentary.outlook}</p>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 text-center">
                  Generated by FundFacts AI &nbsp;|&nbsp; This commentary is AI-generated for informational purposes only &nbsp;|&nbsp; Not investment advice
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
