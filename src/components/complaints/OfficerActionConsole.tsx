'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { ComplaintStatus } from '@/types';
import { CheckCircle2, Send, ShieldCheck, XCircle } from 'lucide-react';

interface ActionConsoleProps {
  complaintId: string;
  currentStatus: ComplaintStatus;
}

export function OfficerActionConsole({ complaintId, currentStatus }: ActionConsoleProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ComplaintStatus>(currentStatus);
  const [remarks, setRemarks] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          remarks,
          resolutionSummary: status === 'RESOLVED' ? resolutionSummary : undefined,
          isInternal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      setFeedback({
        type: 'success',
        message: `Grievance status updated to "${status}" successfully.`,
      });

      setRemarks('');
      setResolutionSummary('');
      router.refresh();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error executing status transition',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-gov-300 bg-white shadow-sm">
      <CardHeader className="bg-gov-50/50 pb-3 border-b border-gov-100">
        <CardTitle className="text-sm font-bold text-gov-950 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gov-800" />
          <span>Officer Redressal & Action Console</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {feedback && (
          <Alert variant={feedback.type === 'success' ? 'success' : 'danger'}>
            {feedback.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Workflow Status Transition:
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
            >
              <option value="UNDER_REVIEW">Under Review (Initial Inspection)</option>
              <option value="ASSIGNED">Assigned to Field Team</option>
              <option value="IN_PROGRESS">In Progress (Field Work Active)</option>
              <option value="AWAITING_CITIZEN_RESPONSE">Awaiting Citizen Response</option>
              <option value="RESOLVED">Mark as Resolved</option>
              <option value="REJECTED">Reject Complaint</option>
            </Select>
          </div>

          {status === 'RESOLVED' && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1.5">
              <label className="block text-xs font-bold text-emerald-900">
                Official Resolution Summary * (Visible to Citizen)
              </label>
              <Textarea
                placeholder="Detail the repair/actions taken (e.g. Bituminous patching completed; verified on site)..."
                rows={3}
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Officer Remarks & Updates:
            </label>
            <Textarea
              placeholder="Enter remarks explaining the progress or field inspection notes..."
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 bg-slate-50">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-gov-800"
            />
            <span className="text-xs text-slate-600 font-medium">
              Internal Department Note only (Hide this update from public citizen view)
            </span>
          </label>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Commit Status Transition & Notify Citizen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
