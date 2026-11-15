'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { submitComplaintAction } from '@/actions/complaints';
import { resizeForUpload } from '@/lib/images/client-resize';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LatLng } from '@/components/maps/LocationPicker';

// The map library is only downloaded when the user reaches the location step.
const LocationPicker = dynamic(() => import('@/components/maps/LocationPicker'), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full sm:h-80" />,
});

const STEPS = ['Details', 'Location', 'Photo', 'Review'];

interface UploadedPhoto {
  imageId: string;
  previewUrl: string;
}

export function SubmitWizard({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [urgent, setUrgent] = useState(false);
  // No default location: stays null until the user clicks the map or uses GPS.
  const [location, setLocation] = useState<LatLng | null>(null);
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);
  const [consent, setConsent] = useState(false);

  const [lookingUp, setLookingUp] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  function goTo(next: number) {
    setError(null);
    setStep(next);
    // Move keyboard / screen-reader focus to the new step's heading.
    setTimeout(() => heading.current?.focus(), 0);
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (title.trim().length < 5) return 'Please enter a title of at least 5 characters.';
      if (description.trim().length < 15) return 'Please describe the problem in at least 15 characters.';
    }
    if (step === 1) {
      if (!location) return 'Please mark the location: click the map or use "Use my location".';
      if (address.trim().length < 5) return 'Please enter the address or a nearby landmark.';
    }
    if (step === 2 && !photo) return 'Please add one photo of the problem.';
    return null;
  }

  function next() {
    const problem = validateStep();
    if (problem) setError(problem);
    else goTo(step + 1);
  }

  async function pickLocation(point: LatLng) {
    setLocation(point);
    setError(null);
    setLookingUp(true);
    try {
      const res = await fetch(`/api/geocode?lat=${point.lat}&lng=${point.lng}`);
      const data = await res.json();
      if (res.ok && data.address) setAddress(data.address);
    } catch {
      // Address lookup is a convenience. The user can always type the address.
    } finally {
      setLookingUp(false);
    }
  }

  async function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', await resizeForUpload(file), 'photo.jpg');
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhoto(data);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'The photo could not be uploaded. Please try another one.');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!consent) {
      setError('Please tick the consent box to submit.');
      return;
    }
    setSubmitting(true);
    setError(null);
    // Server Action call: runs submitComplaint() on the server.
    const response = await submitComplaintAction({
      title,
      description,
      categoryId: categoryId || undefined,
      address,
      latitude: location?.lat,
      longitude: location?.lng,
      urgencyDeclared: urgent,
      consentGiven: consent,
      imageId: photo?.imageId,
    });
    if (response.ok) {
      // The result screen is its own URL, so it survives a refresh and can be bookmarked.
      router.replace(`/citizen/complaints/${response.result.id}?submitted=1`);
    } else {
      setSubmitting(false);
      setError(response.message);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <ol className="grid grid-cols-4 gap-2" aria-label="Steps">
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? 'step' : undefined}
            className={cn(
              'rounded-lg border px-2 py-2 text-center text-sm font-medium',
              index === step && 'border-brand-700 bg-brand-700 text-white',
              index < step && 'border-brand-200 bg-brand-50 text-brand-800',
              index > step && 'border-slate-200 bg-white text-slate-600'
            )}
          >
            <span className="sm:hidden">{index + 1}</span>
            <span className="hidden sm:inline">
              {index + 1}. {label}
            </span>
            {index < step && <span className="sr-only"> (done)</span>}
          </li>
        ))}
      </ol>

      <Card>
        <h2 ref={heading} tabIndex={-1} className="mb-4 outline-none">
          Step {step + 1} of 4: {STEPS[step]}
        </h2>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <Input label="Title" hint="A short summary, for example: Deep pothole near the bus stand." value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required />
            <Textarea
              label="Description"
              hint="What is wrong, since when, and who is affected? English or Hinglish is fine."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={3000}
              required
            />
            <Select label="Category (optional)" hint="Leave on automatic if you are not sure." value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Choose automatically</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <label className="flex items-start gap-3 rounded-lg border border-slate-300 p-3">
              <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="mt-0.5 h-5 w-5 accent-brand-700" />
              <span className="text-sm text-slate-800">This is urgent: there is an immediate risk to people&apos;s safety.</span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">Click the map exactly where the problem is, or use your current location. You can drag the pin to adjust it.</p>
            <LocationPicker value={location} onChange={pickLocation} />
            <p className="text-sm" aria-live="polite">
              {location ? (
                <span className="font-medium text-slate-800">
                  Pin placed at {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  {lookingUp && ' (looking up the address...)'}
                </span>
              ) : (
                <span className="font-medium text-amber-800">No location selected yet.</span>
              )}
            </p>
            <Input label="Address or landmark" hint="Filled in from the map when possible. Please correct it if needed." value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} required />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Add one clear photo of the problem. Please do not photograph people. The photo is made smaller on your device before it is sent.
            </p>
            <input ref={fileInput} id="photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFileChosen} />
            {photo ? (
              <div className="space-y-3">
                <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  <Image src={photo.previewUrl} alt="Preview of the photo you uploaded" fill sizes="(min-width: 640px) 448px, 100vw" className="object-cover" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="secondary" loading={uploading} onClick={() => fileInput.current?.click()}>
                    Replace photo
                  </Button>
                  <Button type="button" variant="danger" onClick={() => setPhoto(null)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="secondary" loading={uploading} onClick={() => fileInput.current?.click()} className="h-32 w-full flex-col border-dashed">
                {!uploading && <ImagePlus className="h-6 w-6" aria-hidden />}
                {uploading ? 'Uploading...' : 'Choose or take a photo'}
              </Button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="font-medium text-slate-600">Title</dt>
              <dd>{title}</dd>
              <dt className="font-medium text-slate-600">Description</dt>
              <dd className="whitespace-pre-line">{description}</dd>
              <dt className="font-medium text-slate-600">Category</dt>
              <dd>{categories.find((c) => c.id === categoryId)?.name ?? 'Choose automatically'}</dd>
              <dt className="font-medium text-slate-600">Urgent</dt>
              <dd>{urgent ? 'Yes' : 'No'}</dd>
              <dt className="font-medium text-slate-600">Address</dt>
              <dd>{address}</dd>
              <dt className="font-medium text-slate-600">Map pin</dt>
              <dd>
                {location?.lat.toFixed(5)}, {location?.lng.toFixed(5)}
              </dd>
            </dl>
            {photo && (
              <div className="relative aspect-[4/3] w-40 overflow-hidden rounded-lg border border-slate-200">
                <Image src={photo.previewUrl} alt="Photo attached to this complaint" fill sizes="160px" className="object-cover" />
              </div>
            )}
            <label className="flex items-start gap-3 rounded-lg border border-slate-300 p-3">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 accent-brand-700" />
              <span className="text-sm leading-relaxed text-slate-800">
                I confirm this report is true to the best of my knowledge. I agree that my description, location and photo are stored
                and analysed by software (and by a vision model, if enabled) to categorise the complaint, find duplicates and help an
                officer review it. See the{' '}
                <Link href="/privacy" target="_blank" className="link">
                  privacy page
                </Link>
                .
              </span>
            </label>
          </div>
        )}
      </Card>

      <div className="flex justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="secondary" onClick={() => goTo(step - 1)} disabled={submitting}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <Button type="button" onClick={next} disabled={uploading}>
            Continue
          </Button>
        ) : (
          <Button type="button" onClick={submit} loading={submitting}>
            {submitting ? 'Submitting...' : 'Submit complaint'}
          </Button>
        )}
      </div>
    </div>
  );
}
