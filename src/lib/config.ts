import fs from 'fs';
import path from 'path';
import { parse } from 'smol-toml';
import type { I18nConfig } from '@/types/i18n';

export interface CvLink {
  label: string;
  href: string;
  note?: string;
}

export interface SiteConfig {
  site: {
    title: string;
    description: string;
    favicon: string;
    last_updated?: string;
    url?: string;
    og_image?: string;
    keywords?: string[];
  };
  author: {
    name: string;
    title: string;
    institution: string;
    avatar: string;
    name_note?: string;
    alternate_names?: string[];
    affiliations?: string[];
    tagline?: string;
  };
  cv?: CvLink[];
  analytics?: {
    umami_script?: string;
    umami_website_id?: string;
    domains?: string;
    share_url?: string;
    map_data?: string;
  };
  social: {
    email?: string;
    emails?: string[];
    location?: string;
    location_url?: string;
    location_details?: string[];
    google_scholar?: string;
    orcid?: string;
    github?: string;
    linkedin?: string;
    [key: string]: string | string[] | undefined;
  };
  features: {
    enable_likes: boolean;
    enable_one_page_mode?: boolean;
  };
  extra_pages?: string[];
  navigation: Array<{
    title: string;
    type: 'section' | 'page' | 'link';
    target: string;
    href: string;
  }>;
  sections?: Array<{
    id: string;
    type: 'markdown' | 'publications' | 'list' | 'cards';
    source?: string;
    title?: string;
    filter?: string;
    limit?: number;
  }>;
  i18n?: I18nConfig;
}

const DEFAULT_CONTENT_DIR = 'content';

function normalizeLocale(locale: string): string {
  return locale.trim().replace('_', '-').toLowerCase();
}

function readConfigFromPath(configPath: string): Partial<SiteConfig> | null {
  try {
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    return parse(fileContent) as unknown as Partial<SiteConfig>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function mergeConfig(base: SiteConfig, localized?: Partial<SiteConfig> | null): SiteConfig {
  if (!localized) return base;

  return {
    ...base,
    site: {
      ...base.site,
      ...(localized.site || {}),
    },
    author: {
      ...base.author,
      ...(localized.author || {}),
    },
    social: {
      ...base.social,
      ...(localized.social || {}),
    },
    features: base.features,
    navigation: localized.navigation || base.navigation,
    sections: localized.sections || base.sections,
    cv: localized.cv || base.cv,
    // analytics settings are shared by all locales
    analytics: base.analytics,
    // i18n is always sourced from default content/config.toml
    i18n: base.i18n,
  };
}

function getDefaultConfig(): SiteConfig {
  const defaultPath = path.join(process.cwd(), DEFAULT_CONTENT_DIR, 'config.toml');
  const parsed = readConfigFromPath(defaultPath);

  if (!parsed) {
    throw new Error('Failed to load content/config.toml');
  }

  return parsed as SiteConfig;
}

export function getConfig(locale?: string): SiteConfig {
  try {
    const baseConfig = getDefaultConfig();

    if (!locale) {
      return baseConfig;
    }

    const normalizedLocale = normalizeLocale(locale);
    const localizedPath = path.join(process.cwd(), `${DEFAULT_CONTENT_DIR}_${normalizedLocale}`, 'config.toml');
    const localizedConfig = readConfigFromPath(localizedPath);

    return mergeConfig(baseConfig, localizedConfig);
  } catch (error) {
    console.error('Error loading config:', error);
    throw new Error('Failed to load configuration');
  }
}
