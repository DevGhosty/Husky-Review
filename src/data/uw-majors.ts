/** Common UW majors for profile autocomplete (free-text entry still allowed). */
export const UW_MAJORS = [
  'Accounting',
  'Aeronautics & Astronautics',
  'American Ethnic Studies',
  'Anthropology',
  'Applied Computing',
  'Architecture',
  'Art History',
  'Biochemistry',
  'Bioengineering',
  'Biology',
  'Business Administration',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Communication',
  'Comparative Literature',
  'Computer Engineering',
  'Computer Science',
  'Construction Management',
  'Drama',
  'Economics',
  'Education',
  'Electrical Engineering',
  'English',
  'Environmental Science',
  'Finance',
  'Geography',
  'Global Studies',
  'Health Studies',
  'History',
  'Human Centered Design & Engineering',
  'Informatics',
  'Interdisciplinary Arts & Sciences',
  'Law, Societies, and Justice',
  'Marketing',
  'Materials Science & Engineering',
  'Mathematics',
  'Mechanical Engineering',
  'Media & Communication Studies',
  'Microbiology',
  'Neuroscience',
  'Nursing',
  'Philosophy',
  'Physics',
  'Political Science',
  'Psychology',
  'Public Health',
  'Sociology',
  'Statistics',
  'Other',
] as const;

export type UwMajor = (typeof UW_MAJORS)[number];

const normalizedMajors = UW_MAJORS.map((major) => ({
  label: major,
  normalized: major.toLowerCase(),
}));

export function filterUwMajors(query: string, limit = 8): string[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return UW_MAJORS.slice(0, limit);
  }

  const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = normalizedMajors
    .filter(({ normalized, label }) => {
      if (label.toLowerCase().includes(trimmed.toLowerCase())) {
        return true;
      }
      return terms.every((term) => normalized.includes(term));
    })
    .map(({ label }) => label);

  const exact = trimmed;
  if (!matches.some((major) => major.toLowerCase() === exact.toLowerCase())) {
    return [exact, ...matches].slice(0, limit);
  }

  return matches.slice(0, limit);
}
