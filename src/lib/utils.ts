import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

export function formatDeadline(value: string) {
  if (!value) {
    return 'No deadline selected'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

export function isValidJobPostingUrl(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 8) {
    return false
  }

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return parsed.hostname.includes('.')
  } catch {
    return false
  }
}

export function hasJobPostingInput(jobDescription: string, jobPostingUrl: string): boolean {
  return jobDescription.trim().length >= 80 || isValidJobPostingUrl(jobPostingUrl)
}

export function jobPostingInputProgress(jobDescription: string, jobPostingUrl: string): number {
  if (jobDescription.trim().length >= 80) {
    return 100
  }
  if (isValidJobPostingUrl(jobPostingUrl)) {
    return Math.max(70, Math.min(100, Math.round((jobDescription.trim().length / 80) * 100)))
  }
  return Math.min(100, Math.round((jobDescription.trim().length / 80) * 100))
}
