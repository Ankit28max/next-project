import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <article className="page prose-block max-w-3xl">
      <h1>Privacy</h1>
      <p>JanSetu is an academic demonstration. Please do not submit real personal or sensitive information.</p>

      <h2>What we store</h2>
      <ul>
        <li>Account: name, email, optional phone number, and a one-way hash of your password (never the password itself).</li>
        <li>Complaint: title, description, address, map coordinates and one photo.</li>
        <li>
          Photo facts: before the photo&apos;s metadata is removed, we keep the capture time, GPS position, camera model and
          editing software if present. The stored photo itself contains no metadata.
        </li>
        <li>Activity: sign-ins, failed sign-in attempts and changes to complaints, for the audit log.</li>
      </ul>

      <h2>Why</h2>
      <ul>
        <li>To route your complaint to a department and let an officer act on it.</li>
        <li>To link duplicate reports of the same problem.</li>
        <li>To point out possibly misleading submissions to an officer. A person always makes the decision.</li>
      </ul>

      <h2>Who can see what</h2>
      <ul>
        <li>You see your own complaints and their public status history.</li>
        <li>Officers see complaints routed to their department, including your name and contact details.</li>
        <li>Administrators see all complaints.</li>
        <li>Anyone with a reference number can see only the status, category and department of that complaint.</li>
        <li>Stored photos are reachable by anyone who has their long random web address. Do not photograph people.</li>
      </ul>

      <h2>Other services</h2>
      <ul>
        <li>If a vision model is configured, your photo, title and description are sent to Google Gemini for analysis.</li>
        <li>Map tiles are loaded from OpenStreetMap, and the coordinates you pick are sent to its Nominatim service to suggest an address.</li>
        <li>The application is hosted on Vercel, with the database on Neon.</li>
      </ul>

      <h2>Consent</h2>
      <p>
        Before submitting a complaint you are asked to agree to this processing. The box is never ticked for you. This project
        does not use face recognition, biometrics or any government identity system.
      </p>
    </article>
  );
}
