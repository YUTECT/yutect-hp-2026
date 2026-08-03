export const CONTACT_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSerYprRNm-I3zc2EPUdLoJaTWgQhVqE55cW4OUYQTXzzLolVQ/viewform?usp=dialog';

const downloadUrl = import.meta.env.PUBLIC_REVIT_SUKETTO_DOWNLOAD_URL?.trim() ?? '';

export const REVIT_SUKETTO_RELEASE = {
  version: import.meta.env.PUBLIC_REVIT_SUKETTO_VERSION?.trim() || '1.0.0-alpha.8',
  releasedAt: import.meta.env.PUBLIC_REVIT_SUKETTO_RELEASE_DATE?.trim() || '2026.08.02',
  fileSize: import.meta.env.PUBLIC_REVIT_SUKETTO_FILE_SIZE?.trim() || '121.33 MB',
  fileName:
    import.meta.env.PUBLIC_REVIT_SUKETTO_FILE_NAME?.trim() ||
    'sketto-1.0.0-alpha.8.zip',
  downloadUrl,
  isAvailable: Boolean(downloadUrl),
} as const;
