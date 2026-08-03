/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly MICROCMS_SERVICE_DOMAIN: string;
  readonly MICROCMS_API_KEY: string;
  readonly PUBLIC_REVIT_SUKETTO_DOWNLOAD_URL?: string;
  readonly PUBLIC_REVIT_SUKETTO_VERSION?: string;
  readonly PUBLIC_REVIT_SUKETTO_RELEASE_DATE?: string;
  readonly PUBLIC_REVIT_SUKETTO_FILE_SIZE?: string;
  readonly PUBLIC_REVIT_SUKETTO_FILE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
