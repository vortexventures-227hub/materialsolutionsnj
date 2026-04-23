export type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
};

export type LeadCapturePayload = {
  success?: boolean;
  degraded?: boolean;
  captureState?: 'success' | 'degraded' | 'failure';
  message?: string;
  error?: string;
};

export type ContactFormFeedback = {
  title: string;
  message: string;
  degraded: boolean;
};

export function validateContactForm(data: ContactFormData): string | null {
  if (!data.email.trim() && !data.phone.trim()) {
    return 'Please provide an email address or phone number.';
  }

  return null;
}

export function getContactFormFeedback(input: {
  ok: boolean;
  status: number;
  payload: LeadCapturePayload | null;
}): { feedback: ContactFormFeedback | null; error: string | null } {
  const payload = input.payload;

  if (input.ok && payload?.success) {
    if (payload.captureState === 'degraded' || payload.degraded) {
      return {
        feedback: {
          title: 'Request Received — Manual Follow-Up Queued',
          message:
            payload.message ||
            'We captured your request into our recovery queue and alerted the team for manual follow-up. If this is urgent, please reach us at info@materialsolutionsnj.com.',
          degraded: true,
        },
        error: null,
      };
    }

    if (payload.captureState === 'success') {
      return {
        feedback: {
          title: 'Request Received',
          message:
            payload.message ||
            'Your request was received and routed to our team.',
          degraded: false,
        },
        error: null,
      };
    }

    return {
      feedback: null,
      error: 'We could not verify that your request was captured. Please reach us at info@materialsolutionsnj.com.',
    };
  }

  return {
    feedback: null,
    error:
      payload?.error ||
      payload?.message ||
      (input.status >= 500
        ? 'We could not save your request. Please reach us at info@materialsolutionsnj.com.'
        : 'Something went wrong. Please try again or give us a call.'),
  };
}
