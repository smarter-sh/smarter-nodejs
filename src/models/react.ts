/**
 * Models of the Smarter platform's Django-React integration: a React app's Vite manifest, and the assets that a template includes.
 *
 * The platform's web console pages are React apps that Django hosts. These schemas are a copy of the
 * platform's `smarter.lib.django.templatetags.smarter_react_contract`, as the Python SDK's
 * `smarter.models.react` is, so that tools that build or check React apps for a Smarter platform can
 * use them without the platform.
 *
 * - {@link ViteManifest} reads a Vite-generated React `manifest.json`: its chunks keyed by source
 *   path, and Smarter's own `_custom` build information.
 * - {@link ReactAppAssets} is what every `<app>_react_assets` template tag returns: the ordered JS
 *   and CSS files that a Django template includes for a React app.
 *
 * The manifest is a third-party shape: {@link ViteManifestChunk} declares the fields that Vite
 * documents, and keeps the others, which newer Vite (or Rolldown) versions add.
 */

import { z } from "zod";

/** The kinds of asset that a React app's entry point loads. */
export type ReactAssetType = "js" | "css";

/** The key of the build information that each React package's `vite.config.ts` adds to its manifest.json. */
export const BUILD_INFO_KEY = "_custom";

/** One entry of a Vite-generated `manifest.json`: a chunk, or a static asset. See https://vite.dev/guide/backend-integration. */
export const ViteManifestChunk = z.looseObject({
  /** The output file of this chunk, relative to the app's static directory. */
  file: z.string(),
  /** The chunk's name. */
  name: z.string().nullish(),
  /** The names of a static asset. */
  names: z.array(z.string()).default([]),
  /** The chunk's source path. */
  src: z.string().nullish(),
  /** Whether this chunk is an entry point. */
  isEntry: z.boolean().default(false),
  /** Whether this chunk is a dynamic entry point. */
  isDynamicEntry: z.boolean().default(false),
  /** The manifest keys of statically imported chunks. */
  imports: z.array(z.string()).default([]),
  /** The manifest keys of dynamically imported chunks. */
  dynamicImports: z.array(z.string()).default([]),
  /** The CSS files that this chunk loads. */
  css: z.array(z.string()).default([]),
  /** The other static files that this chunk references. */
  assets: z.array(z.string()).default([]),
});
export type ViteManifestChunk = z.infer<typeof ViteManifestChunk>;

/** The build information that each React package's `vite.config.ts` adds to its manifest.json, as `_custom`. */
export const ReactAppBuildInfo = z.strictObject({
  /** When the app was built. */
  buildTime: z.string(),
  /** The version of the app's npm package. */
  version: z.string(),
  /** The build's NODE_ENV, e.g. production. */
  buildEnv: z.string(),
});
export type ReactAppBuildInfo = z.infer<typeof ReactAppBuildInfo>;

/** The ordered JS and CSS files of a React app's entry point, which a Django template includes. */
export const ReactAppAssets = z.strictObject({
  /** The JS files, the entry point's first. */
  js: z.array(z.string()).default([]),
  /** The CSS files, the entry point's first. */
  css: z.array(z.string()).default([]),
});
export type ReactAppAssets = z.infer<typeof ReactAppAssets>;

/**
 * A React app's Vite-generated `manifest.json`: its chunks, keyed by source path, and Smarter's build information.
 *
 * @example
 * ```ts
 * const manifest = ViteManifest.parse(JSON.parse(readFileSync("manifest.json", "utf-8")));
 * const entry = manifest.entryKey();
 * if (entry) console.log(manifest.collectAssets(entry, "js"));
 * ```
 */
export class ViteManifest {
  /** The manifest's chunks, keyed by source path. */
  readonly chunks: Record<string, ViteManifestChunk>;
  /** The `_custom` build information, if the package's vite.config.ts adds it. */
  readonly buildInfo: ReactAppBuildInfo | null;

  /**
   * @param chunks - The chunks, keyed by source path.
   * @param buildInfo - The build information.
   */
  constructor(chunks: Record<string, ViteManifestChunk>, buildInfo: ReactAppBuildInfo | null = null) {
    this.chunks = chunks;
    this.buildInfo = buildInfo;
  }

  /**
   * Validate a manifest.json's content, and split its `_custom` entry from its chunks.
   *
   * @param data - The parsed manifest.json.
   * @returns The manifest.
   * @throws `ZodError` If an entry is not a chunk.
   */
  static parse(data: unknown): ViteManifest {
    const entries = z.record(z.string(), z.unknown()).parse(data);
    const { [BUILD_INFO_KEY]: buildInfo, ...chunks } = entries;
    return new ViteManifest(
      z.record(z.string(), ViteManifestChunk).parse(chunks),
      buildInfo === undefined || buildInfo === null ? null : ReactAppBuildInfo.parse(buildInfo),
    );
  }

  /**
   * The manifest in the shape of manifest.json, with the build information as its `_custom` entry.
   *
   * @returns The chunks, keyed by source path, and `_custom`.
   */
  toJSON(): Record<string, ViteManifestChunk | ReactAppBuildInfo> {
    return this.buildInfo === null ? { ...this.chunks } : { ...this.chunks, [BUILD_INFO_KEY]: this.buildInfo };
  }

  /** Whether the manifest has any chunks. */
  get isEmpty(): boolean {
    return Object.keys(this.chunks).length === 0;
  }

  /**
   * The key of the manifest's entry point, the first chunk with `"isEntry": true`.
   *
   * @returns The entry point's key, or null if the manifest has no entry point.
   */
  entryKey(): string | null {
    return Object.entries(this.chunks).find(([, chunk]) => chunk.isEntry)?.[0] ?? null;
  }

  /**
   * Recursively collect the JS or CSS files of a chunk and of its static imports.
   *
   * A chunk's own files come first, followed by those of each of its `imports`, depth first, in the
   * order they are listed. Each chunk is visited once, so circular imports terminate.
   *
   * @param key - The manifest key of the chunk to collect assets for.
   * @param assetType - `js` for the chunks' `file`, `css` for their `css` files.
   * @param seen - The keys already visited, used by the recursion.
   * @returns The asset file paths, relative to the app's static directory.
   */
  collectAssets(key: string, assetType: ReactAssetType, seen = new Set<string>()): string[] {
    const chunk = this.chunks[key];
    if (seen.has(key) || chunk === undefined) return [];
    seen.add(key);
    const assets = assetType === "js" ? [chunk.file] : [...chunk.css];
    for (const imported of chunk.imports) assets.push(...this.collectAssets(imported, assetType, seen));
    return assets;
  }
}
