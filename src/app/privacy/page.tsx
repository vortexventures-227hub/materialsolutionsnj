import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy policy for Material Solutions NJ covering contact forms, website usage, and how customer information is handled.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.materialsolutionsnj.com/privacy',
    title: 'Privacy Policy | Material Solutions NJ',
    description:
      'Privacy policy for Material Solutions NJ covering contact forms, website usage, and how customer information is handled.',
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Privacy Policy</h1>
        <div className="prose prose-neutral text-text-secondary space-y-4">
          <p>
            Material Solutions LLC (&quot;Material Solutions,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, and safeguard information when you visit our website
            at <strong>materialsolutionsnj.com</strong> (the &quot;Site&quot;) and use our equipment and services.
          </p>
          <h2 className="text-xl font-semibold text-text-primary pt-4">Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you fill out a contact form,
            request a quote, communicate with our team, or otherwise interact with the Site. This may include
            your name, email address, phone number, company name, message content, and any other information
            you choose to provide.
          </p>
          <h2 className="text-xl font-semibold text-text-primary pt-4">How We Use Your Information</h2>
          <p>
            We use the information we collect to respond to your inquiries, process service and equipment requests,
            communicate about products and services, improve our Site and operations, and comply with applicable law.
            We do not sell your personal information to third parties.
          </p>
          <h2 className="text-xl font-semibold text-text-primary pt-4">Information Sharing</h2>
          <p>
            We may share your information with service providers who assist us in operating the Site and our business,
            and when required by law or to protect our rights. We do not share your information with third parties
            for marketing purposes.
          </p>
          <h2 className="text-xl font-semibold text-text-primary pt-4">Data Retention</h2>
          <p>
            We retain your information for as long as necessary to fulfill the purposes for which it was collected,
            comply with our legal obligations, and support our legitimate business operations.
          </p>
          <h2 className="text-xl font-semibold text-text-primary pt-4">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your rights regarding your personal
            information, please contact us at{' '}
            <a href="mailto:info@materialsolutionsnj.com" className="text-accent-primary hover:underline">
              info@materialsolutionsnj.com
            </a>{' '}
            or call (973) 500-1010.
          </p>
          <p className="text-sm text-text-secondary pt-4">
            Last updated: April 2026
          </p>
        </div>
      </div>
    </main>
  );
}
