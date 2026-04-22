'use client';

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Mail, Phone, Send, Text, User } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

export type LeadCaptureOption = {
  id: string;
  label: string;
};

export type LeadCaptureFormSource = 'home' | 'inventory_index' | 'inventory_detail';
export type PreferredContactMethod = 'email' | 'phone' | 'text';

type LeadCaptureFormValues = {
  name: string;
  email: string;
  phone: string;
  unitId: string;
  message: string;
  preferredContact: PreferredContactMethod;
  honeypot: string;
};

type LeadCaptureFormErrors = Partial<Record<keyof LeadCaptureFormValues, string>>;

export type LeadCaptureSubmissionPayload = {
  name: string;
  email: string;
  phone: string;
  unit_id_of_interest: string | null;
  message_body: string;
  preferred_contact: PreferredContactMethod;
  form_source: LeadCaptureFormSource;
  honeypot: string;
  message: string;
  source: string;
  page_origin: string;
  cta_origin: string;
  subject: string;
  listing_id?: string;
  listing_slug?: string;
  listing_title?: string;
};

export interface LeadCaptureFormProps {
  units: LeadCaptureOption[];
  formSource: LeadCaptureFormSource;
  pageOrigin: string;
  preselectedUnitId?: string | null;
  listingContext?: {
    id?: string;
    slug?: string;
    title?: string;
  };
  title?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
}

const ANY_UNIT_VALUE = 'any-unit';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOLDOWN_MS = 30_000;

const CONTACT_OPTIONS: Array<{
  value: PreferredContactMethod;
  label: string;
  icon: typeof Mail;
}> = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'text', label: 'Text', icon: Text },
];

function normalizePhone(value: string): string {
  return value.replace(/[^\d()-\s+]/g, '');
}

export function validateLeadCaptureForm(values: LeadCaptureFormValues): LeadCaptureFormErrors {
  const errors: LeadCaptureFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Full name is required.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (values.phone.trim() && values.phone.trim().length < 10) {
    errors.phone = 'Phone number looks too short.';
  }

  if (!values.message.trim()) {
    errors.message = 'Message is required.';
  } else if (values.message.trim().length < 10) {
    errors.message = 'Please share at least 10 characters so we can help.';
  }

  if (values.honeypot.trim()) {
    errors.honeypot = 'Spam detected.';
  }

  return errors;
}

export function isLeadCaptureFormValid(values: LeadCaptureFormValues): boolean {
  return Object.keys(validateLeadCaptureForm(values)).length === 0;
}

export function buildLeadCapturePayload(args: {
  values: LeadCaptureFormValues;
  formSource: LeadCaptureFormSource;
  pageOrigin: string;
  unitLabel?: string;
  listingContext?: LeadCaptureFormProps['listingContext'];
}): LeadCaptureSubmissionPayload {
  const { values, formSource, pageOrigin, unitLabel, listingContext } = args;
  const unitId = values.unitId === ANY_UNIT_VALUE ? null : values.unitId;
  const subject = unitLabel
    ? `Lead capture: ${unitLabel}`
    : 'Lead capture request';

  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    unit_id_of_interest: unitId,
    message_body: values.message.trim(),
    preferred_contact: values.preferredContact,
    form_source: formSource,
    honeypot: values.honeypot.trim(),
    message: values.message.trim(),
    source: formSource,
    page_origin: pageOrigin,
    cta_origin: `${formSource}_lead_capture_submit`,
    subject,
    ...(listingContext?.id ? { listing_id: listingContext.id } : {}),
    ...(listingContext?.slug ? { listing_slug: listingContext.slug } : {}),
    ...(listingContext?.title ? { listing_title: listingContext.title } : {}),
  };
}

const baseFormState: LeadCaptureFormValues = {
  name: '',
  email: '',
  phone: '',
  unitId: ANY_UNIT_VALUE,
  message: '',
  preferredContact: 'email',
  honeypot: '',
};

export default function LeadCaptureForm({
  units,
  formSource,
  pageOrigin,
  preselectedUnitId,
  listingContext,
  title = 'Tell us what you need',
  description = 'Send a quick note and David will follow up fast with current availability, pricing, and next steps.',
  submitLabel = 'Send to David',
  className,
}: LeadCaptureFormProps) {
  const [values, setValues] = useState<LeadCaptureFormValues>(() => ({
    ...baseFormState,
    unitId: preselectedUnitId || ANY_UNIT_VALUE,
  }));
  const [touched, setTouched] = useState<Partial<Record<keyof LeadCaptureFormValues, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    setValues((current) => ({
      ...current,
      unitId: preselectedUnitId || current.unitId || ANY_UNIT_VALUE,
    }));
  }, [preselectedUnitId]);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownRemaining(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, cooldownUntil - Date.now());
      setCooldownRemaining(remaining);
      if (remaining === 0) {
        setCooldownUntil(null);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 500);
    return () => window.clearInterval(intervalId);
  }, [cooldownUntil]);

  const validationErrors = useMemo(() => validateLeadCaptureForm(values), [values]);
  const formIsValid = useMemo(() => isLeadCaptureFormValid(values), [values]);
  const selectedUnitLabel = useMemo(() => {
    if (values.unitId === ANY_UNIT_VALUE) return undefined;
    return units.find((unit) => unit.id === values.unitId)?.label;
  }, [units, values.unitId]);
  const showError = (field: keyof LeadCaptureFormValues): string | undefined => {
    if (!submitAttempted && !touched[field]) return undefined;
    return validationErrors[field];
  };

  const submitLocked = isSubmitting || cooldownRemaining > 0 || !formIsValid;

  function setField<K extends keyof LeadCaptureFormValues>(field: K, value: LeadCaptureFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setTouched({
      name: true,
      email: true,
      phone: true,
      unitId: true,
      message: true,
      preferredContact: true,
      honeypot: true,
    });

    if (!cooldownUntil) {
      setCooldownUntil(Date.now() + COOLDOWN_MS);
    }

    if (!formIsValid) {
      setSubmitError('Please tighten up the highlighted fields and try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          buildLeadCapturePayload({
            values,
            formSource,
            pageOrigin,
            unitLabel: selectedUnitLabel,
            listingContext,
          })
        ),
      });

      if (!response.ok) {
        throw new Error(`Lead submit failed with ${response.status}`);
      }

      setSuccessEmail(values.email.trim());
      setValues({
        ...baseFormState,
        unitId: preselectedUnitId || ANY_UNIT_VALUE,
      });
      setTouched({});
      setSubmitAttempted(false);
    } catch {
      setSubmitError(
        'We could not send that right now. Please try again in a moment, or email us directly at david@materialsolutionsnj.com.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successEmail) {
    return (
      <section
        className={cn(
          'rounded-2xl border border-green-200 bg-green-50/80 p-6 shadow-sm',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={22} />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-secondary-900">Got it</p>
            <p className="text-sm leading-6 text-secondary-700">
              David will follow up within about 5 minutes. Confirmation sent to{' '}
              <span className="font-semibold text-secondary-900">{successEmail}</span>.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        'rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm sm:p-6',
        className
      )}
    >
      <div className="mb-5 space-y-2">
        <p className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
          Quick Lead Intake
        </p>
        <h2 className="text-2xl font-bold text-secondary-900">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-secondary-600">{description}</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <input
          aria-hidden="true"
          autoComplete="off"
          className="hidden"
          name="website"
          tabIndex={-1}
          value={values.honeypot}
          onChange={(event) => setField('honeypot', event.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id={`${formSource}-lead-name`}
            name="name"
            label="Full name"
            placeholder="Your full name"
            value={values.name}
            error={showError('name')}
            onBlur={() => setTouched((current) => ({ ...current, name: true }))}
            onChange={(event) => setField('name', event.target.value)}
            autoComplete="name"
          />

          <Input
            id={`${formSource}-lead-email`}
            name="email"
            type="email"
            label="Email"
            placeholder="you@company.com"
            value={values.email}
            error={showError('email')}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            onChange={(event) => setField('email', event.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id={`${formSource}-lead-phone`}
            name="phone"
            type="tel"
            label="Phone"
            placeholder="123-456-7890"
            hint="Optional"
            value={values.phone}
            error={showError('phone')}
            onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
            onChange={(event) => setField('phone', normalizePhone(event.target.value))}
            autoComplete="tel"
          />

          <div className="space-y-1.5">
            <label
              htmlFor={`${formSource}-lead-unit`}
              className="block text-sm font-medium text-secondary-700"
            >
              Unit of interest
            </label>
            <select
              id={`${formSource}-lead-unit`}
              name="unitId"
              className="block w-full rounded-xl border border-secondary-200 bg-white px-4 py-2.5 text-sm text-secondary-900 transition-colors duration-200 hover:border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              value={values.unitId}
              onChange={(event) => setField('unitId', event.target.value)}
            >
              <option value={ANY_UNIT_VALUE}>Any unit / not sure yet</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Textarea
          id={`${formSource}-lead-message`}
          name="message"
          label="Message / question"
          placeholder="Tell us what you're trying to move, where it's going, or what unit caught your eye."
          rows={5}
          value={values.message}
          error={showError('message')}
          onBlur={() => setTouched((current) => ({ ...current, message: true }))}
          onChange={(event) => setField('message', event.target.value)}
          aria-describedby={showError('message') ? `${formSource}-lead-message-error` : undefined}
        />

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-secondary-700">Preferred contact method</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {CONTACT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                  values.preferredContact === value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-200 text-secondary-700 hover:border-secondary-300 hover:bg-secondary-50'
                )}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="preferredContact"
                  value={value}
                  checked={values.preferredContact === value}
                  onChange={(event) =>
                    setField('preferredContact', event.target.value as PreferredContactMethod)
                  }
                />
                <Icon size={16} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {submitError ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>{submitError}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs leading-5 text-secondary-500">
            <p>We only use this to reply about equipment, pricing, and next steps.</p>
            {cooldownRemaining > 0 ? (
              <p className="font-medium text-secondary-700">
                Retry opens in {Math.ceil(cooldownRemaining / 1000)}s.
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitLocked}
            loading={isSubmitting}
            icon={!isSubmitting ? <Send size={16} /> : undefined}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Sending...' : submitLabel}
          </Button>
        </div>
      </form>
    </section>
  );
}
