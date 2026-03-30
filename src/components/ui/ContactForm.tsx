'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Send, CheckCircle, ArrowRight } from 'lucide-react';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'contact_form',
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', phone: '', company: '', message: '' });
      } else {
        setError('Something went wrong. Please try again or give us a call.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card padding="lg" className="relative overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />

      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-secondary-900">
          Send Us a Message
        </h2>
        <p className="mt-2 text-secondary-500">
          Fill out the form below and our team will get back to you promptly.
        </p>
      </div>

      {isSubmitted ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50/50">
            <CheckCircle className="text-green-500" size={36} />
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-2">
            Message Sent Successfully
          </h3>
          <p className="text-secondary-500 max-w-md mx-auto mb-8">
            Thank you for reaching out. Bill or a member of our team will be
            in touch within a few hours during business hours.
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsSubmitted(false)}
            iconRight={<ArrowRight size={16} />}
          >
            Send Another Message
          </Button>
        </div>
      ) : (
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
              label="Email Address *"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@company.com"
              required
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
            <p className="text-xs text-secondary-400">
              We respect your privacy. No spam, ever.
            </p>
          </div>
        </form>
      )}
    </Card>
  );
}
