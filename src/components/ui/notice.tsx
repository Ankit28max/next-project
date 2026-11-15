import { Alert } from './alert';

// After a successful Server Action the user is redirected back with ?notice=<code>.
// Only codes from this list are ever shown, so the URL cannot inject arbitrary text.
const NOTICES: Record<string, string> = {
  'status-updated': 'Status updated. The citizen has been notified.',
  'note-saved': 'Internal note saved.',
  reopened: 'Complaint reopened. The department has been notified.',
  reassigned: 'Complaint reassigned.',
  'officer-created': 'Officer account created.',
  'officer-updated': 'Officer account updated.',
  'rule-saved': 'Routing rule saved.',
  'rule-updated': 'Routing rule updated.',
};

export function Notice({ code }: { code?: string }) {
  const message = code ? NOTICES[code] : undefined;
  if (!message) return null;
  return <Alert variant="success">{message}</Alert>;
}
