import { generateWebsite } from './builderService';

function buildPlanText(prompt: string): string {
  const lower = prompt.toLowerCase();

  const isSaas = lower.includes('saas') || lower.includes('software') || lower.includes('platform') || lower.includes('tool') || lower.includes('app');
  const isAgency = lower.includes('agency') || lower.includes('studio') || lower.includes('creative') || lower.includes('portfolio');
  const isEcom = lower.includes('shop') || lower.includes('store') || lower.includes('ecommerce') || lower.includes('product');

  const type = isSaas ? 'SaaS platform' : isAgency ? 'creative agency' : isEcom ? 'e-commerce store' : 'business';
  const style = isSaas ? 'modern and minimal' : isAgency ? 'bold and editorial' : isEcom ? 'clean and conversion-focused' : 'professional and clean';
  const audience = isSaas ? 'developers and startups' : isAgency ? 'businesses looking for creative services' : isEcom ? 'online shoppers' : 'potential customers and partners';

  return `✅ Plan (Checklist)

• Understand business requirements from your prompt
• Choose color palette and typography for the brand
• Design hero section with strong headline and CTA
• Build features/services section to highlight value
• Add social proof or testimonials section
• Include a clear call-to-action section
• Write navigation and footer with key links

📋 Project Summary

This is a ${type} website built for: "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}".

It targets ${audience} and presents your offering in a ${style} design. The goal is to convert visitors into leads or customers through clear messaging and compelling UI.

📄 Pages Details

1. Home Page
   • Hero section — bold headline, subheadline, primary CTA button
   • Features grid — 3 key benefits with icons and descriptions
   • Social proof — testimonials or trust badges
   • Call-to-action banner — drives signups or inquiries

2. About Page
   • Mission statement and brand story
   • Team member cards with photos and roles
   • Core values section
   • Company milestones timeline

3. Services / Products Page
   • Service or product cards with pricing
   • Comparison table for different tiers
   • FAQ accordion section
   • Bottom CTA to get started

4. Contact Page
   • Contact form (name, email, message)
   • Business address and hours
   • Embedded map or location
   • Social media profile links

⚙️ Technical Details

• Tech Stack: React 18 + Tailwind CSS
• Components: Functional components with React hooks
• Styling: Tailwind CSS utility classes (mobile-first)
• Responsive: Works on mobile, tablet, and desktop
• Typography: Clean system font stack with custom sizing
• Icons: Lucide React for consistent iconography
• State: React useState for interactive UI elements
• Preview: Live rendered in sandboxed iframe`;
}

export async function mockStreamResponse(
  prompt: string,
  onToken: (token: string) => void,
  onDone: (fullText: string, code: string) => void,
  onError: (err: string) => void
): Promise<void> {
  const fullText = buildPlanText(prompt);

  // Stream text character by character
  let i = 0;
  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      // Send chunks of 3 chars at a time for speed
      const chunk = fullText.slice(i, i + 3);
      if (chunk) {
        onToken(chunk);
        i += 3;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, 12);
  });

  // Generate website code in background
  try {
    const code = await generateWebsite(prompt);
    onDone(fullText, code);
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Code generation failed');
  }
}
