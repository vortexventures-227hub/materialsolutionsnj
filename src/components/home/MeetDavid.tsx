'use client';

import { motion, type Variants } from 'framer-motion';
import { Brain, MessageSquare, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useChatStore } from '@/stores/chatStore';

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: FeatureItem[] = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'Instant Knowledge',
    description: 'Every spec, history, and detail about our entire inventory at his fingertips.',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Natural Conversation',
    description: 'Ask questions like you would a real sales specialist. Get clear, honest answers.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Seamless Handoff',
    description: 'Ready to buy? David connects you with our team for delivery and support.',
  },
];

const sampleMessages = [
  {
    role: 'ai' as const,
    text: "Hi! I'm David, your AI sales specialist. I've reviewed our inventory and I think the Raymond Reach Truck would be perfect for your needs. It has excellent maneuverability for tight warehouse spaces.",
  },
  {
    role: 'user' as const,
    text: "What's the price range for that model?",
  },
  {
    role: 'ai' as const,
    text: 'We have several in stock ranging from $16,500 to $19,200 depending on hours and condition. The newest one has only 1,450 hours.',
  },
];

export default function MeetDavid() {
  const openChat = useChatStore((state) => state.openChat);
  const leftVariants: Variants = {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const rightVariants: Variants = {
    hidden: { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="relative w-full bg-bg-primary py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={leftVariants}
            className="flex flex-col space-y-8"
          >
            {/* Eyebrow */}
            <div>
              <span className="inline-block font-mono text-xs sm:text-sm tracking-widest uppercase text-accent-ai mb-4">
                Your AI Sales Specialist
              </span>
              <h2 className="text-section font-bold text-text-primary mb-4">
                Meet David
              </h2>
              <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
                David knows every forklift in our inventory inside and out. With 27+ years of
                Material Solutions expertise built into his AI, he delivers honest appraisals,
                instant answers, and real solutions—not sales pressure.
              </p>
            </div>

            {/* Features */}
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-primary/10">
                      <span className="text-accent-primary">{feature.icon}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.button
              onClick={openChat}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className={cn(
                'w-fit px-8 py-3 rounded-lg font-semibold',
                'bg-gradient-to-r from-accent-ai to-accent-glow',
                'text-bg-primary shadow-glow-yellow hover:shadow-glow-yellow-lg',
                'transition-all hover:scale-105 text-sm sm:text-base'
              )}
            >
              Chat with David Now
            </motion.button>
          </motion.div>

          {/* Right Column - Chat Mockup */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={rightVariants}
            className="flex justify-center"
          >
            <div
              className={cn(
                'w-full max-w-sm rounded-2xl overflow-hidden',
                'bg-bg-tertiary border border-white/[0.1]',
                'shadow-card-dark'
              )}
            >
              {/* Chat Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-white/[0.06] bg-bg-secondary flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-glow flex items-center justify-center text-bg-primary font-bold">
                    D
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-accent-primary"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">David</h3>
                  <p className="text-xs text-accent-success">Online now</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="px-4 sm:px-6 py-6 space-y-4 h-80 overflow-y-auto bg-bg-tertiary">
                {sampleMessages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-xs px-4 py-2 rounded-lg text-sm',
                        message.role === 'user'
                          ? 'bg-accent-primary text-bg-primary rounded-br-none'
                          : 'bg-bg-secondary text-text-primary rounded-bl-none border border-white/[0.1]'
                      )}
                    >
                      {message.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="px-4 sm:px-6 py-4 border-t border-white/[0.06] bg-bg-secondary">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Ask about inventory..."
                    disabled
                    className="flex-1 px-3 py-2 bg-bg-tertiary border border-white/[0.06] rounded-lg text-text-secondary text-sm placeholder-text-tertiary outline-none"
                  />
                  <button
                    disabled
                    className="p-2 bg-accent-primary/20 rounded-lg text-accent-primary hover:bg-accent-primary/30 transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
