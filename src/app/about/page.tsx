import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <article className="page prose-block max-w-3xl">
      <h1>About JanSetu</h1>
      <p>
        JanSetu (&quot;bridge to the people&quot;) is a student project for the course INT257, Modern Web Application
        Development. It demonstrates a grievance portal in which citizens report civic problems with a photo and a location,
        and software helps officers by categorising complaints, linking likely duplicates and pointing out suspicious
        submissions.
      </p>
      <p>
        <strong>It is not a real government service.</strong> Complaints submitted here are not sent to any authority.
      </p>

      <h2>Team</h2>
      <ul>
        <li>Abhinav Singla (12408467)</li>
        <li>Ankit Singh (12407308)</li>
        <li>Devansh (12407745)</li>
      </ul>

      <h2>Built with</h2>
      <ul>
        <li>Next.js 14 (App Router), React 18 and TypeScript</li>
        <li>PostgreSQL with Prisma</li>
        <li>Tailwind CSS</li>
        <li>Leaflet with OpenStreetMap map tiles and Nominatim address lookup</li>
        <li>sharp and exifr for image processing</li>
        <li>Google Gemini as an optional vision model</li>
      </ul>

      <h2>Known limits</h2>
      <ul>
        <li>Keyword rules miss complaints written in unusual words, and they do not understand context.</li>
        <li>Photo metadata can be edited or removed, so metadata checks are hints, not proof.</li>
        <li>The duplicate score depends on wording; the same problem described very differently may not be linked.</li>
      </ul>
    </article>
  );
}
