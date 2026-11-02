import React from 'react';
import { getSessionUser } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, ShieldCheck, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gov-900">Citizen Profile</h1>
        <p className="text-xs text-slate-500">
          Your registered identity and authentication details.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Account Details</CardTitle>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <User className="h-5 w-5 text-gov-700" />
            <div>
              <span className="text-slate-400 font-medium block">Full Name:</span>
              <span className="font-bold text-slate-900 text-sm">{user.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <Mail className="h-5 w-5 text-gov-700" />
            <div>
              <span className="text-slate-400 font-medium block">Email Address:</span>
              <span className="font-mono text-slate-900">{user.email}</span>
            </div>
          </div>

          {user.phone && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Phone className="h-5 w-5 text-gov-700" />
              <div>
                <span className="text-slate-400 font-medium block">Mobile Phone:</span>
                <span className="font-mono text-slate-900">{user.phone}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            <span>Account identity verified for civic grievance submission.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
