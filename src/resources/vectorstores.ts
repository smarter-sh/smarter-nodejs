/**
 * Vectorstores: vector databases for retrieval-augmented generation.
 *
 * @example
 * ```ts
 * await client.vectorstores.addText(2, "Our refund window is 30 days.", { name: "refunds" });
 * await client.vectorstores.addFiles(2, ["handbook.pdf"]);
 * for (const result of (await client.vectorstores.search(2, "How long is the refund window?")).results) {
 *   console.log(result.score, result.text);
 * }
 * ```
 */

import { openAsBlob } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

import type { RequestOptions } from "../core/http.ts";
import type { JsonValue, SmarterId } from "../core/typing.ts";
import {
  Vectorstore,
  VectorstoreDocumentDeleted,
  VectorstoreDocuments,
  VectorstoreDocumentsAdded,
  VectorstoreRestored,
  VectorstoreSearchResults,
  VectorstoreSnapshot,
  VectorstoreSnapshots,
  VectorstoreStatus,
} from "../models/vectorstore.ts";
import { resourceId, SmarterKindResource } from "./base.ts";

/** How a vectorstore search ranks chunks. */
export type VectorstoreSearchType = "similarity" | "mmr" | "similarity_score_threshold";

/** The options of a vectorstore search, beside the per-request options. */
export interface VectorstoreSearchOptions extends RequestOptions {
  /** How many chunks to return, 4 by default. The platform caps it. */
  k?: number;
  /** `similarity` (the default), `mmr` (maximal marginal relevance), or `similarity_score_threshold`. */
  searchType?: VectorstoreSearchType;
  /** The minimum score, for `similarity_score_threshold`. */
  scoreThreshold?: number | null;
  /** How many chunks `mmr` considers. */
  fetchK?: number | null;
  /** `mmr`'s balance of relevance (1) and diversity (0). */
  lambdaMult?: number | null;
  /** Only chunks whose metadata match. */
  filter?: Record<string, JsonValue> | null;
}

/** A file to upload: its path, its `file:` url, or a `File`. */
export type UploadInput = string | URL | File;

/**
 * Vectorstores: `/api/v1/vectorstores/`, and the manifest api's `Vectorstore` kind.
 *
 * The platform serves these endpoints only when `SMARTER_ENABLE_VECTORSTORE` is true.
 */
export class Vectorstores extends SmarterKindResource<typeof Vectorstore> {
  readonly kind = "Vectorstore";
  readonly path = "vectorstores/";
  readonly model = Vectorstore;

  /**
   * A vectorstore's state, checked now.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param options - Per-request options.
   * @returns Its status and vector count.
   */
  async status(id: SmarterId, options?: RequestOptions): Promise<VectorstoreStatus> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/status/`, VectorstoreStatus, options);
  }

  /**
   * Deploy a vectorstore: create its database, or connect to the provider's.
   *
   * A self-hosted vectorstore creates real, possibly billable, Kubernetes resources.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param options - Per-request options.
   * @returns The vectorstore.
   */
  async deploy(id: SmarterId, options?: RequestOptions): Promise<Vectorstore> {
    return this.http.request("POST", `${this.path}${resourceId(id)}/deploy/`, Vectorstore, options);
  }

  /**
   * Stop serving a vectorstore. A self-hosted server's data is kept.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param options - Per-request options.
   * @returns The vectorstore.
   */
  async undeploy(id: SmarterId, options?: RequestOptions): Promise<Vectorstore> {
    return this.http.request("POST", `${this.path}${resourceId(id)}/undeploy/`, Vectorstore, options);
  }

  /**
   * A vectorstore's documents, newest first.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param options - Per-request options.
   * @returns The documents.
   */
  async documents(id: SmarterId, options?: RequestOptions): Promise<VectorstoreDocuments> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/documents/`, VectorstoreDocuments, options);
  }

  /**
   * Add a text as a document.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param text - The text.
   * @param options - `name`: the document's name. `metadata`: a JSON object, stored with each of the document's chunks.
   * @returns The added document. It is loaded asynchronously, once the vectorstore is deployed.
   */
  async addText(
    id: SmarterId,
    text: string,
    options?: RequestOptions & { name?: string | null; metadata?: Record<string, JsonValue> | null },
  ): Promise<VectorstoreDocumentsAdded> {
    const body: Record<string, JsonValue> = { text };
    if (options?.name) body["name"] = options.name;
    if (options?.metadata) body["metadata"] = options.metadata;
    return this.http.request("POST", `${this.path}${resourceId(id)}/documents/`, VectorstoreDocumentsAdded, {
      ...options,
      json: body,
    });
  }

  /**
   * Add a public web page or file, by its url, as a document. The platform fetches it.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param url - The url.
   * @param options - `metadata`: a JSON object, stored with each of the document's chunks.
   * @returns The added document.
   */
  async addUrl(
    id: SmarterId,
    url: string,
    options?: RequestOptions & { metadata?: Record<string, JsonValue> | null },
  ): Promise<VectorstoreDocumentsAdded> {
    const body: Record<string, JsonValue> = { url };
    if (options?.metadata) body["metadata"] = options.metadata;
    return this.http.request("POST", `${this.path}${resourceId(id)}/documents/`, VectorstoreDocumentsAdded, {
      ...options,
      json: body,
    });
  }

  /**
   * Upload files as documents, e.g. PDF, Word, HTML or text files. The platform extracts their text.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param files - The files: paths, `file:` urls, or `File` objects.
   * @param options - Per-request options.
   * @returns The added documents.
   */
  async addFiles(
    id: SmarterId,
    files: readonly UploadInput[],
    options?: RequestOptions,
  ): Promise<VectorstoreDocumentsAdded> {
    const form = new FormData();
    for (const file of files) {
      if (file instanceof File) {
        form.append("files", file, file.name);
      } else {
        const path = file instanceof URL ? fileURLToPath(file) : file;
        form.append("files", await openAsBlob(path), basename(path));
      }
    }
    return this.http.request("POST", `${this.path}${resourceId(id)}/documents/`, VectorstoreDocumentsAdded, {
      ...options,
      body: form,
    });
  }

  /**
   * Remove a document and its chunks. The removal is asynchronous.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param documentId - The document's id.
   * @param options - Per-request options.
   * @returns The document, being deleted.
   */
  async deleteDocument(
    id: SmarterId,
    documentId: number,
    options?: RequestOptions,
  ): Promise<VectorstoreDocumentDeleted> {
    return this.http.request(
      "DELETE",
      `${this.path}${resourceId(id)}/documents/${resourceId(documentId)}/`,
      VectorstoreDocumentDeleted,
      options,
    );
  }

  /**
   * Search a vectorstore.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param query - The search text.
   * @param options - `k`, `searchType`, `scoreThreshold`, `fetchK`, `lambdaMult` and `filter`.
   * @returns The matching chunks, best first.
   */
  async search(id: SmarterId, query: string, options?: VectorstoreSearchOptions): Promise<VectorstoreSearchResults> {
    const body: Record<string, JsonValue> = {
      query,
      k: options?.k ?? 4,
      searchType: options?.searchType ?? "similarity",
    };
    const optional: Record<string, JsonValue | undefined> = {
      scoreThreshold: options?.scoreThreshold ?? undefined,
      fetchK: options?.fetchK ?? undefined,
      lambdaMult: options?.lambdaMult ?? undefined,
      filter: options?.filter && Object.keys(options.filter).length > 0 ? options.filter : undefined,
    };
    for (const [key, value] of Object.entries(optional)) if (value !== undefined) body[key] = value;
    return this.http.request("POST", `${this.path}${resourceId(id)}/search/`, VectorstoreSearchResults, {
      ...options,
      json: body,
    });
  }

  /**
   * A vectorstore's snapshots.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param options - Per-request options.
   * @returns The snapshots.
   */
  async snapshots(id: SmarterId, options?: RequestOptions): Promise<VectorstoreSnapshots> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/snapshots/`, VectorstoreSnapshots, options);
  }

  /**
   * Take a snapshot of a vectorstore's data now.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param options - Per-request options.
   * @returns The snapshot.
   */
  async createSnapshot(id: SmarterId, options?: RequestOptions): Promise<VectorstoreSnapshot> {
    return this.http.request("POST", `${this.path}${resourceId(id)}/snapshots/`, VectorstoreSnapshot, options);
  }

  /**
   * Replace a vectorstore's data with one of its snapshots.
   *
   * @param id - The vectorstore's id or hashed id.
   * @param snapshotId - The snapshot's id.
   * @param options - Per-request options.
   * @returns The restored vector count.
   */
  async restore(id: SmarterId, snapshotId: number, options?: RequestOptions): Promise<VectorstoreRestored> {
    return this.http.request(
      "POST",
      `${this.path}${resourceId(id)}/snapshots/${resourceId(snapshotId)}/restore/`,
      VectorstoreRestored,
      options,
    );
  }
}
