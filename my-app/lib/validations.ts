import { z } from 'zod';

// Validates incoming feedback submissions from forms, webhooks, or CSV imports
export const FeedbackCreateSchema = z.object({
  content: z.string().trim().min(1, 'Feedback content cannot be empty').max(5000, 'Content is too long'),
  source: z.string().trim().optional().default('Web Form'),
  customerName: z.string().trim().nullable().optional(),
  customerEmail: z.string().trim().email('Invalid email address').nullable().optional().or(z.literal('')),
});

export type FeedbackCreateInput = z.infer<typeof FeedbackCreateSchema>;

// Validates feedback status and triage updates
export const FeedbackUpdateSchema = z.object({
  id: z.string().min(1, 'Feedback ID is required'),
  status: z.enum(['NEW', 'REVIEWED', 'ACTIONED']).optional(),
  category: z.enum(['Performance', 'Bug', 'Feature Request', 'UI/UX', 'Billing', 'Support', 'General']).optional(),
  urgency: z.enum(['High', 'Medium', 'Low']).optional(),
});

export type FeedbackUpdateInput = z.infer<typeof FeedbackUpdateSchema>;

// Validates request to re-classify feedback with AI
export const FeedbackReclassifySchema = z.object({
  id: z.string().min(1, 'Feedback ID is required'),
});

export type FeedbackReclassifyInput = z.infer<typeof FeedbackReclassifySchema>;

// Validates custom theme creation
export const ThemeCreateSchema = z.object({
  name: z.string().trim().min(1, 'Theme name is required').max(100, 'Theme name is too long'),
  description: z.string().trim().nullable().optional(),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Enter a valid hex color').optional().default('#3b82f6'),
});

export type ThemeCreateInput = z.infer<typeof ThemeCreateSchema>;

// Validates natural language query sent to Ask LOOP
export const AskLoopQuerySchema = z.object({
  question: z.string().trim().min(1, 'Question cannot be empty').max(1000, 'Question is too long'),
});

export type AskLoopQueryInput = z.infer<typeof AskLoopQuerySchema>;

// Validates executive report generation timeframe
export const ReportGenerateSchema = z.object({
  period: z.string().trim().optional().default('Last 30 Days'),
});

export type ReportGenerateInput = z.infer<typeof ReportGenerateSchema>;

// Validates new team member invitation
export const MemberInviteSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  name: z.string().trim().optional(),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']).optional().default('VIEWER'),
});

export type MemberInviteInput = z.infer<typeof MemberInviteSchema>;

// Validates role updates for existing members
export const MemberRoleUpdateSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  newRole: z.enum(['ADMIN', 'ANALYST', 'VIEWER']),
});

export type MemberRoleUpdateInput = z.infer<typeof MemberRoleUpdateSchema>;

// Validates and sanitizes raw JSON returned by AI providers (Grok, Claude, Groq)
export const AIClassificationOutputSchema = z.object({
  sentiment: z.enum(['Positive', 'Neutral', 'Negative']).catch('Neutral'),
  sentimentScore: z.number().min(-1.0).max(1.0).catch(0.0),
  category: z.enum(['Performance', 'Bug', 'Feature Request', 'UI/UX', 'Billing', 'Support', 'General']).catch('General'),
  urgency: z.enum(['High', 'Medium', 'Low']).catch('Low'),
  summary: z.string().catch('Customer feedback submitted.'),
  tags: z.array(z.string()).catch([]),
  suggestedThemes: z.array(z.string()).optional().catch([]),
});

export type AIClassificationOutput = z.infer<typeof AIClassificationOutputSchema>;
