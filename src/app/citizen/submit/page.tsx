'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Camera,
  CheckCircle2,
  FileCheck,
  FileText,
  MapPin,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';

// Dynamically import Leaflet location picker to prevent SSR errors
const LeafletLocationPicker = dynamic(
  () => import('@/components/maps/LeafletLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400 animate-pulse">
        Loading Interactive Map...
      </div>
    ),
  }
);

interface UploadedImageItem {
  storageUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  imageHash?: string;
}

export default function SubmitGrievancePage() {
  const router = useRouter();

  // Wizard Steps: 1: Details, 2: Evidence, 3: Location, 4: Review
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [urgencyDeclared, setUrgencyDeclared] = useState(false);
  const [images, setImages] = useState<UploadedImageItem[]>([]);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.2090);
  const [consentGiven, setConsentGiven] = useState(true);

  // Dynamic Options
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Successful submission result
  const [submissionResult, setSubmissionResult] = useState<{
    referenceNumber: string;
    id: string;
    aiSummary?: any;
  } | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && data.data?.categories) {
          setCategories(data.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories');
      }
    }
    loadCategories();
  }, []);

  // Image upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setImages((prev) => [...prev, data.data]);
    } catch (err: any) {
      setError(err.message || 'Image upload failed. Please try a different photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (!title.trim() || title.length < 5) {
        setError('Please enter a descriptive grievance title (min 5 characters)');
        return;
      }
      if (!description.trim() || description.length < 15) {
        setError('Please provide sufficient description details (min 15 characters)');
        return;
      }
    }
    if (currentStep === 3) {
      if (!address.trim()) {
        setError('Please provide a valid street address or landmark');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitGrievance = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title,
        description,
        categoryId: categoryId || undefined,
        address,
        latitude,
        longitude,
        urgencyDeclared,
        consentGiven,
        images,
      };

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register grievance');
      }

      setSubmissionResult({
        referenceNumber: data.data.referenceNumber,
        id: data.data.id,
        aiSummary: data.data.aiSummary,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process grievance submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation view upon success
  if (submissionResult) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Card className="border-emerald-200 bg-white shadow-md text-center">
          <CardContent className="p-8 space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-gov-900">
                Grievance Registered Successfully!
              </h2>
              <p className="text-xs text-slate-500">
                Your complaint has been logged into the municipal grievance redressal system.
              </p>
            </div>

            {/* Reference Number Banner */}
            <div className="bg-gov-50 border-2 border-dashed border-gov-300 p-4 rounded-xl space-y-1">
              <span className="text-xs text-gov-700 font-semibold uppercase tracking-wider block">
                Official Grievance Reference ID
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-gov-900">
                {submissionResult.referenceNumber}
              </span>
              <p className="text-[11px] text-slate-400">
                Please save this reference number for all future correspondence.
              </p>
            </div>

            {/* AI Processing Report Callout */}
            {submissionResult.aiSummary && (
              <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-gov-800 font-bold">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Automated AI Pipeline Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="font-semibold block">Predicted Category:</span>
                    <span>{submissionResult.aiSummary.category}</span>
                  </div>
                  <div>
                    <span className="font-semibold block">Routed Department:</span>
                    <span>{submissionResult.aiSummary.department || 'Under Triage'}</span>
                  </div>
                  <div>
                    <span className="font-semibold block">Suggested Priority:</span>
                    <span>{submissionResult.aiSummary.priority}</span>
                  </div>
                  <div>
                    <span className="font-semibold block">Classification Confidence:</span>
                    <span>{Math.round(submissionResult.aiSummary.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href={`/citizen/complaints/${submissionResult.id}`} className="w-full sm:w-auto">
                <Button variant="primary" className="w-full">
                  Track Live Redressal Status
                </Button>
              </Link>
              <Link href="/citizen" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gov-900">File a Public Civic Grievance</h1>
        <p className="text-xs text-slate-500">
          Step {currentStep} of 4: Provide accurate incident details, photos, and location coordinates.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { step: 1, label: '1. Incident Details' },
          { step: 2, label: '2. Photo Evidence' },
          { step: 3, label: '3. Map Location' },
          { step: 4, label: '4. Review & Submit' },
        ].map((item) => (
          <div
            key={item.step}
            className={`p-2.5 rounded-lg text-center text-xs font-semibold border transition-all ${
              currentStep === item.step
                ? 'bg-gov-900 text-white border-gov-900 shadow-xs'
                : currentStep > item.step
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="danger" title="Please check inputs">
          {error}
        </Alert>
      )}

      {/* Step 1: Details */}
      {currentStep === 1 && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle>Grievance Information</CardTitle>
            <CardDescription>
              Describe the problem clearly. The AI system will classify your category and assign appropriate officers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Complaint Title *"
              placeholder="e.g. Hazardous pothole near Sector 14 Metro Station"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Select
              label="Civic Category (Optional - AI will automatically verify)"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Let AI automatically detect category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>

            <Textarea
              label="Detailed Description *"
              placeholder="Provide exact situational details: How long has this issue existed? Is there immediate hazard to traffic or pedestrians?"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={urgencyDeclared}
                onChange={(e) => setUrgencyDeclared(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-gov-800 focus:ring-gov-700"
              />
              <span className="text-xs text-slate-700 font-medium">
                Mark as High Urgency (Immediate risk to public health or life safety)
              </span>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Evidence */}
      {currentStep === 2 && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle>Supporting Photo Evidence</CardTitle>
            <CardDescription>
              Upload clear photographs of the site. Images are checked for perceptual uniqueness and relevance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Box */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-gov-500 transition-colors bg-slate-50/50">
              <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Click to upload incident photograph
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: JPEG, PNG, WebP (Max 5MB)
              </p>

              <label className="mt-4 inline-block">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isUploading}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Camera className="h-4 w-4 mr-1.5" />
                  Select Photo
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Uploaded Images List */}
            {images.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Uploaded Evidence ({images.length}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg border border-slate-200 overflow-hidden bg-white group shadow-xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.storageUrl}
                        alt="Evidence preview"
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white p-1 rounded-full transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="p-1.5 text-[10px] text-slate-600 truncate bg-white">
                        {img.fileName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Location */}
      {currentStep === 3 && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle>Incident Geographic Location</CardTitle>
            <CardDescription>
              Drop a pin on the OpenStreetMap or use GPS coordinates. This enables geographic duplicate detection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LeafletLocationPicker
              initialLat={latitude}
              initialLng={longitude}
              onLocationSelect={(lat, lng, resolvedAddr) => {
                setLatitude(lat);
                setLongitude(lng);
                if (resolvedAddr) {
                  setAddress(resolvedAddr);
                }
              }}
            />

            <Input
              label="Street Address / Landmark Details *"
              placeholder="e.g. Near Shop 12, Main Central Market, Sector 4"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              helperText="You can refine the auto-resolved address manually."
              required
            />
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle>Review & Consent Confirmation</CardTitle>
            <CardDescription>
              Please verify all entered parameters before dispatching to the AI classification pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-500 block">Title:</span>
                  <span className="font-bold text-slate-900 text-sm">{title}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Urgency Level:</span>
                  <span className={urgencyDeclared ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                    {urgencyDeclared ? 'Declared Urgent / Critical' : 'Standard Routine'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 block">Description:</span>
                <p className="text-slate-800 leading-relaxed mt-0.5">{description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="font-semibold text-slate-500 block">Address:</span>
                  <span className="text-slate-800">{address}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">GPS Coordinates:</span>
                  <span className="font-mono text-slate-800">
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </span>
                </div>
              </div>

              {images.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-500 block mb-1">
                    Attached Evidence ({images.length} file):
                  </span>
                  <div className="flex gap-2">
                    {images.map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={img.storageUrl}
                        alt="Thumb"
                        className="h-12 w-12 object-cover rounded border border-slate-300"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Legal Consent */}
            <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg border border-slate-200 bg-white">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-gov-800 focus:ring-gov-700 mt-0.5"
                required
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I hereby declare that the information provided is genuine and truthful to the best of my knowledge. I understand that submitting deliberately fabricated claims or copyrighted stock photos will be flagged by the automated risk assessment engine.
              </span>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Wizard Footer Controls */}
      <div className="flex items-center justify-between pt-2">
        {currentStep > 1 ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <Button type="button" variant="primary" onClick={handleNext}>
            Continue <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="success"
            onClick={handleSubmitGrievance}
            isLoading={isSubmitting}
            disabled={!consentGiven}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Submit & Run AI Redressal
          </Button>
        )}
      </div>
    </div>
  );
}
