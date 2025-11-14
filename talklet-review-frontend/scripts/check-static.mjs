#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FRONTEND_ROOT = join(__dirname, '..');

const FORBIDDEN_PATTERNS = [
  { pattern: /getServerSideProps/, message: 'getServerSideProps is not allowed (SSR)' },
  { pattern: /getStaticProps/, message: 'getStaticProps is not allowed (ISR without revalidate)' },
  { pattern: /getInitialProps/, message: 'getInitialProps is not allowed (SSR)' },
  { pattern: /export\s+const\s+revalidate/, message: 'revalidate is not allowed (ISR)' },
  { pattern: /['"]use server['"]/, message: '"use server" directive is not allowed (Server Actions)' },
  { pattern: /from\s+['"]next\/headers['"]/, message: 'next/headers is not allowed (Server-only)' },
  { pattern: /from\s+['"]server-only['"]/, message: 'server-only is not allowed' },
  { pattern: /cookies\(\)/, message: 'cookies() is not allowed (Server-only)' },
  { pattern: /headers\(\)/, message: 'headers() is not allowed (Server-only)' },
  { pattern: /dynamic\s*=\s*['"]force-dynamic['"]/, message: 'dynamic="force-dynamic" is not allowed' },
];

const errors = [];

// Check app directory files
const appFiles = glob.sync(join(FRONTEND_ROOT, 'app', '**', '*.{ts,tsx,js,jsx}'));
const pagesFiles = glob.sync(join(FRONTEND_ROOT, 'pages', '**', '*.{ts,tsx,js,jsx}'));

for (const file of [...appFiles, ...pagesFiles]) {
  const content = readFileSync(file, 'utf-8');
  
  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`${file}: ${message}`);
    }
  }
}

// Check for API routes
const apiRoutes = glob.sync(join(FRONTEND_ROOT, 'pages', 'api', '**', '*.{ts,tsx,js,jsx}'));
if (apiRoutes.length > 0) {
  errors.push('API routes found in pages/api/ (not allowed for static export)');
}

const appApiRoutes = glob.sync(join(FRONTEND_ROOT, 'app', 'api', '**', 'route.{ts,tsx,js,jsx}'));
if (appApiRoutes.length > 0) {
  errors.push('API route handlers found in app/api/ (not allowed for static export)');
}

// Check for dynamic routes without generateStaticParams
const dynamicRoutes = glob.sync(join(FRONTEND_ROOT, 'app', '**', '\\[*\\]', 'page.{ts,tsx,js,jsx}'));
for (const dynamicRoute of dynamicRoutes) {
  const dir = dirname(dynamicRoute);
  const content = readFileSync(dynamicRoute, 'utf-8');
  
  // Allow client components (they handle routing dynamically)
  const isClientComponent = content.includes('"use client"') || content.includes("'use client'");
  
  if (!isClientComponent) {
    // Check for generateStaticParams in server components
    const hasGenerateStaticParams = content.includes('generateStaticParams');
    
    if (!hasGenerateStaticParams) {
      errors.push(`${dynamicRoute}: Dynamic route without generateStaticParams (server component)`);
    }
  }
}

// Check next.config
const nextConfigPath = join(FRONTEND_ROOT, 'next.config.ts');
if (existsSync(nextConfigPath)) {
  const configContent = readFileSync(nextConfigPath, 'utf-8');
  
  if (!configContent.includes('output: "export"') && !configContent.includes("output: 'export'")) {
    errors.push('next.config.ts: Missing output: "export"');
  }
  
  if (!configContent.includes('unoptimized: true')) {
    errors.push('next.config.ts: Missing images.unoptimized: true');
  }
  
  if (!configContent.includes('trailingSlash: true')) {
    errors.push('next.config.ts: Missing trailingSlash: true');
  }
}

// Report results
if (errors.length > 0) {
  console.error('❌ Static export validation failed:\n');
  errors.forEach(error => console.error(`   - ${error}`));
  console.error('\nPlease fix these issues to ensure static export compatibility.');
  process.exit(1);
} else {
  console.log('✅ Static export validation passed');
}

