'use client';

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@envval/ui/components/accordion';
import SectionHeading from '../section-heading';
import { AnimatePresence, motion } from 'motion/react';
import { EASE_OUT } from '@/components/onboarding/get-started-illustration/shared';

const FAQS = [
	{
		question: 'Do I need technical knowledge to use the extension?',
		answer:
			'No. If you use VS Code or another supported editor, you can install the extension and work with your env files from the sidebar. No terminal or DevOps experience required.',
	},
	{
		question: 'How secure is my data?',
		answer:
			'We’re built with security in mind. Sync is designed to be end-to-end encrypted so your secrets stay private. We don’t store or read your raw environment variables.',
	},
	{
		question: 'Does it work with my existing .env files?',
		answer:
			'Yes. The extension works with .env-style files (e.g. .env, .env.local, .env.staging) inside your editor. You can view and edit them without leaving your workflow.',
	},
	{
		question: 'Can I use this with my team?',
		answer:
			'Right now the extension is focused on your local workflow. Team features like shared secrets and access control are not part of the current release but may come later.',
	},
	{
		question: 'Is there a free tier?',
		answer:
			'Yes. We support it and it’s free for now. Use Envval at no cost while we’re in this phase.',
	},
];

const FAQSection = () => {
	return (
		<section className='container max-w-3xl mx-auto px-6 py-24 md:py-32'>
			<SectionHeading
				label='FAQ'
				heading='Your doubts answered'
				text='Quick answers to common questions.'
				align='center'
			/>

			<Accordion className='w-full space-y-4 group/list'>
				{FAQS.map((faq, i) => (
					<AccordionItem
						key={i}
						value={`item-${i}`}
						className='border-none bg-accent/60 px-6 rounded-2xl  transition-all duration-300 
                        group-has-[*[data-open]]/list:opacity-50 group-has-[*[data-open]]/list:data-open:opacity-100 hover:!opacity-100'
					>
						<AccordionTrigger className='py-6 hover:no-underline  text-base md:text-lg font-medium text-foreground/90 data-[state=open]:text-primary/90'>
							<span className='flex-1 text-left'>{faq.question}</span>
						</AccordionTrigger>
						<AccordionContent className='text-base text-muted-foreground pb-6 leading-relaxed'>
							<AnimatePresence mode='wait'>
								<motion.div
									key={i}
									initial={{ opacity: 0, y: 5, filter: 'blur(5px)' }}
									animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
									exit={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
									transition={{ duration: 0.9, ease: EASE_OUT }}
								>
									{faq.answer}
								</motion.div>
							</AnimatePresence>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</section>
	);
};

export default FAQSection;
