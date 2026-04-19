'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle, Loader2, MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  getContactFormFeedback,
  type ContactFormFeedback,
  validateContactForm,
} from '@/components/ui/contactFormState';
import {
  buildContactSubjectOptions,
  normalizeRequestedContactSubject,
} from '@/lib/contactSubjects';

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
}

const emptyForm: FormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  subject: '',
  message: '',
};

export interface ContactFormProps {
  dark?: boolean;
  showSubject?: boolean;
  onChatOpen?: () => void;
}

export function ContactForm({ dark = false, showSubject = false, onChatOpen }: ContactFormProps) {
  const [source, setSource] = useState('contact_form');
  const [pageOrigin, setPageOrigin] = useState('/contact');
  const [ctaOrigin, setCtaOrigin] = useState('contact_form_submit');
  const [listingId, setListingId] = useState<string | null>(null);
  const [listingSlug, setListingSlug] = useState<string | null>(null);
  const [listingTitle, setListingTitle] = useState<string | null>(null);
  const [serviceSlug, setServiceSlug] = useState<string | null>(null);
  const [requestedSubject, setRequestedSubject] = useState('');

  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ContactFormFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subjectOptions = useMemo(
    () => buildContactSubjectOptions(requestedSubject),
    [requestedSubject]
  );
  const initialSubject = useMemo(
    () => normalizeRequestedContactSubject(requestedSubject),
    [requestedSubject]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setSource(params.get('source')?.trim() || 'contact_form');
    setRequestedSubject(params.get('subject')?.trim() || '');
    setPageOrigin(params.get('page_origin')?.trim() || window.location.pathname || '/contact');
    setCtaOrigin(params.get('cta_origin')?.trim() || 'contact_form_submit');
    setListingId(params.get('listing_id')?.trim() || null);
    setListingSlug(params.get('listing_slug')?.trim() || null);
    setListingTitle(params.get('listing_title')?.trim() || null);
    setServiceSlug(params.get('service_slug')?.trim() || null);
  }, []);

  useEffect(() => {
    if (!initialSubject) return;
    setFormData((prev) =>
      prev.subject === initialSubject ? prev : { ...prev, subject: initialSubject }
    );
  }, [initialSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateContactForm({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      message: formData.message,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source,
          page_origin: pageOrigin,
          cta_origin: ctaOrigin,
          listing_id: listingId,
          listing_slug: listingSlug,
          listing_title: listingTitle,
          service_slug: serviceSlug,
        }),
      });

      const payload = await response.json().catch(() => null);
      const result = getContactFormFeedback({ ok: response.ok, status: response.status, payload });

      if (result.feedback) {
        setFeedback(result.feedback);
        setFormData({ ...emptyForm, subject: initialSubject });
      } else {
        setError(result.error);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ─── Feedback panel (success or degraded) ────────────────────────────────────
  if (feedback) {
    if (dark) {
      return (
        <div className="card-dark p-8 lg:p-12 text-center">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ring-4',
              feedback.degraded
                ? 'bg-amber-500/10 ring-amber-500/10'
                : 'bg-accent-success/10 ring-accent-success/5'
            )}
          >
            {feedback.degraded ? (
              <AlertTriangle className="text-amber-400" size={32} />
            ) : (
              <CheckCircle className="text-accent-success" size={32} />
            )}
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-2">{feedback.title}</h3>
          <p className="text-text-secondary max-w-md mx-auto mb-4">{feedback.message}</p>
          <p className="text-text-tertiary text-sm mb-8">
            {feedback.degraded
              ? 'You can still call or chat with David for equipment questions and team contact help.'
              : 'Or chat with David now for equipment questions and team contact help.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setFeedback(null)}
              className={cn(
                'px-6 py-3 rounded-lg font-semibold text-sm',
                'border border-white/10 text-text-primary',
                'hover:border-white/20 hover:bg-white/5 transition-all',
                'inline-flex items-center gap-2 justify-center'
              )}
            >
              Send Another Message
            </button>
            {onChatOpen && (
              <button
                onClick={onChatOpen}
                className={cn(
                  'px-6 py-3 rounded-lg font-semibold text-sm',
                  'bg-accent-primary text-bg-primary',
                  'hover:bg-accent-glow transition-colors',
                  'shadow-glow-yellow inline-flex items-center gap-2 justify-center'
                )}
              >
                <MessageSquare size={16} />
                Talk to David
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <Card padding="lg" className="relative overflow-hidden">
        <div className="text-center py-16">
          <div
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ring-8',
              feedback.degraded ? 'bg-amber-50 ring-amber-50/50' : 'bg-green-50 ring-green-50/50'
            )}
          >
            {feedback.degraded ? (
              <AlertTriangle className="text-amber-500" size={36} />
            ) : (
              <CheckCircle className="text-green-500" size={36} />
            )}
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-2">{feedback.title}</h3>
          <p className="text-secondary-500 max-w-md mx-auto mb-8">{feedback.message}</p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setFeedback(null)}
            iconRight={<ArrowRight size={16} />}
          >
            Send Another Message
          </Button>
        </div>
      </Card>
    );
  }

  // ─── Dark theme form ──────────────────────────────────────────────────────────
  if (dark) {
    const inputCls = cn(
      'w-full px-4 py-3 rounded-lg text-sm',
      'bg-bg-tertiary border border-white/10 text-text-primary placeholder-text-tertiary',
      'focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50',
      'transition-colors'
    );
    const labelCls = 'block text-sm font-medium text-text-secondary mb-1.5';

    return (
      <div className="card-dark p-6 lg:p-8 overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent-primary via-accent-glow to-accent-secondary" />
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Send Us a Message</h2>
          <p className="mt-2 text-text-secondary text-sm">
            Fill out the form below and our team will get back to you promptly.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="cf-name" className={labelCls}>
                Your Name <span className="text-accent-primary">*</span>
              </label>
              <input
                id="cf-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Smith"
                required
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="cf-company" className={labelCls}>Company Name</label>
              <input
                id="cf-company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
                placeholder="ABC Warehousing"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="cf-email" className={labelCls}>Email Address</label>
              <input
                id="cf-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@company.com"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="cf-phone" className={labelCls}>Phone Number</label>
              <input
                id="cf-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className={inputCls}
              />
            </div>
          </div>

          <p className="text-xs text-text-tertiary -mt-1">
            Please provide at least one contact method: email or phone.
          </p>

          {showSubject && (
            <div>
              <label htmlFor="cf-subject" className={labelCls}>What&apos;s this about?</label>
              <select
                id="cf-subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={cn(inputCls, !formData.subject && 'text-text-tertiary')}
              >
                <option value="">Select a topic...</option>
                {subjectOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="cf-message" className={labelCls}>
              How Can We Help? <span className="text-accent-primary">*</span>
            </label>
            <textarea
              id="cf-message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us about your equipment needs, questions, or how we can help..."
              rows={5}
              required
              className={cn(inputCls, 'resize-none')}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full sm:w-auto px-8 py-3.5 rounded-lg font-semibold text-bg-primary',
                'bg-accent-primary hover:bg-accent-glow transition-colors',
                'shadow-glow-yellow hover:shadow-glow-yellow-lg',
                'inline-flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                  <Send size={16} />
                </>
              )}
            </button>
            <p className="text-xs text-text-tertiary">We respect your privacy. No spam, ever.</p>
          </div>
        </form>
      </div>
    );
  }

  // ─── Light theme form ─────────────────────────────────────────────────────────
  return (
    <Card padding="lg" className="relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-secondary-900">Send Us a Message</h2>
        <p className="mt-2 text-secondary-500">
          Fill out the form below and our team will get back to you promptly.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-5">
          <Input
            label="Your Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Smith"
            required
          />
          <Input
            label="Company Name"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="ABC Warehousing"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@company.com"
          />
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(555) 123-4567"
          />
        </div>
        <p className="text-xs text-secondary-400 -mt-2">
          Please provide at least one contact method: email or phone.
        </p>
        <Textarea
          label="How Can We Help? *"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell us about your equipment needs, questions, or how we can help..."
          rows={6}
          required
        />
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Button
            type="submit"
            size="xl"
            loading={isSubmitting}
            iconRight={!isSubmitting ? <Send size={18} /> : undefined}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
          <p className="text-xs text-secondary-400">We respect your privacy. No spam, ever.</p>
        </div>
      </form>
    </Card>
  );
}
