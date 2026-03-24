'use client';

import { useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Have questions? We&apos;re here to help. Reach out and we&apos;ll respond within hours.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <a 
                  href="tel:+1XXXXXXXXXX"
                  className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 transition-colors group"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                    <Phone className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p className="text-gray-600">(XXX) XXX-XXXX</p>
                    <p className="text-sm text-gray-500 mt-1">Mon-Fri, 8AM - 5PM EST</p>
                  </div>
                </a>

                <a 
                  href="mailto:info@materialsolutionsnj.com"
                  className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 transition-colors group"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                    <Mail className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="text-gray-600">info@materialsolutionsnj.com</p>
                    <p className="text-sm text-gray-500 mt-1">We reply within hours</p>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Location</p>
                    <p className="text-gray-600">New Jersey</p>
                    <p className="text-sm text-gray-500 mt-1">Serving all of NJ</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Business Hours</p>
                    <p className="text-gray-600">Monday - Friday</p>
                    <p className="text-gray-600">8:00 AM - 5:00 PM EST</p>
                  </div>
                </div>
              </div>

              {/* David CTA */}
              <div className="mt-8 bg-orange-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💬</span>
                  <h3 className="font-semibold text-gray-900">Chat with David</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Our AI equipment specialist is available 24/7. Click the chat button to get instant answers.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online now
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
                <p className="text-gray-600 mb-8">
                  Fill out the form below and we&apos;ll get back to you as soon as possible.
                </p>

                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600 mb-6">
                      Thank you for reaching out. We&apos;ll be in touch within a few hours.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-orange-600 font-medium hover:text-orange-700"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="ABC Warehousing"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="john@company.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        How Can We Help? *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        placeholder="Tell us about your equipment needs, questions, or how we can help..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full md:w-auto px-8 py-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>Sending...</>
                      ) : (
                        <>
                          Send Message
                          <Send size={18} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="mt-16">
            <div className="bg-gray-200 rounded-2xl h-80 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="text-gray-400 mx-auto mb-2" size={48} />
                <p className="text-gray-500">Map integration coming soon</p>
                <p className="text-sm text-gray-400">Serving all of New Jersey</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
