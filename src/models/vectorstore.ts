/** Models of vectorstores, their documents and snapshots, and search results. */

import { z } from "zod";

import { JsonObject, JsonValue } from "../core/typing.ts";
import { SmarterResource } from "./base.ts";

/** A vectorstore: a vector database, hosted by Smarter or by a provider, for retrieval-augmented generation. */
export const Vectorstore = SmarterResource.extend({
  /** e.g. qdrant or pinecone. */
  backend: z.string().nullish(),
  /** self_hosted or managed. */
  hosting: z.string().nullish(),
  isActive: z.boolean().nullish(),
  dimension: z.number().int().nullish(),
  metric: z.string().nullish(),
  embeddingsProvider: z.string().nullish(),
  embeddingsModel: z.string().nullish(),
  /** e.g. pending, ready or error. */
  status: z.string().nullish(),
  statusMessage: z.string().nullish(),
  indexName: z.string().nullish(),
  endpointUrl: z.string().nullish(),
  vectorCount: z.number().int().nullish(),
  documentCount: z.number().int().nullish(),
  snapshotCount: z.number().int().nullish(),
  spec: JsonObject.nullish(),
  deployedAt: z.string().nullish(),
});
export type Vectorstore = z.infer<typeof Vectorstore>;

/** A vectorstore's state, checked now. */
export const VectorstoreStatus = z.looseObject({
  vectorstore: z.string(),
  status: z.string(),
  message: z.string().nullish(),
  vectorCount: z.number().int().nullish(),
  stats: JsonObject.default({}),
});
export type VectorstoreStatus = z.infer<typeof VectorstoreStatus>;

/** A document of a vectorstore: a file, a text or a url, split into chunks and embedded. */
export const VectorstoreDocument = z.looseObject({
  id: z.number().int(),
  name: z.string(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  /** upload, text or url. */
  source: z.string().nullish(),
  contentType: z.string().nullish(),
  /** e.g. pending, loaded, error or deleting. */
  status: z.string().nullish(),
  chunkCount: z.number().int().nullish(),
  metadata: JsonObject.nullish(),
});
export type VectorstoreDocument = z.infer<typeof VectorstoreDocument>;

/** A vectorstore's documents. */
export const VectorstoreDocuments = z.looseObject({ documents: z.array(VectorstoreDocument).default([]) });
export type VectorstoreDocuments = z.infer<typeof VectorstoreDocuments>;

/** The result of adding documents. Documents are loaded asynchronously, and only once the vectorstore is deployed: see `queued`. */
export const VectorstoreDocumentsAdded = z.looseObject({
  documents: z.array(VectorstoreDocument).default([]),
  /** Documents that already existed. */
  duplicates: z.array(VectorstoreDocument).default([]),
  queued: z.boolean().default(false),
  message: z.string().nullish(),
});
export type VectorstoreDocumentsAdded = z.infer<typeof VectorstoreDocumentsAdded>;

/** A document that is being deleted, with its chunks. */
export const VectorstoreDocumentDeleted = z.looseObject({ document: z.string(), status: z.string() });
export type VectorstoreDocumentDeleted = z.infer<typeof VectorstoreDocumentDeleted>;

/** A chunk that matched a search. */
export const VectorstoreSearchResult = z.looseObject({
  id: JsonValue.nullish(),
  text: z.string(),
  metadata: JsonObject.nullish(),
  score: z.number().nullish(),
});
export type VectorstoreSearchResult = z.infer<typeof VectorstoreSearchResult>;

/** The chunks that matched a search, best first. */
export const VectorstoreSearchResults = z.looseObject({
  vectorstore: z.string(),
  results: z.array(VectorstoreSearchResult).default([]),
});
export type VectorstoreSearchResults = z.infer<typeof VectorstoreSearchResults>;

/** A snapshot of a vectorstore's data. */
export const VectorstoreSnapshot = z.looseObject({
  id: z.number().int(),
  name: z.string().nullish(),
  createdAt: z.string().nullish(),
  status: z.string().nullish(),
  scheduled: z.boolean().nullish(),
  sizeBytes: z.number().int().nullish(),
});
export type VectorstoreSnapshot = z.infer<typeof VectorstoreSnapshot>;

/** A vectorstore's snapshots. */
export const VectorstoreSnapshots = z.looseObject({ snapshots: z.array(VectorstoreSnapshot).default([]) });
export type VectorstoreSnapshots = z.infer<typeof VectorstoreSnapshots>;

/** The result of restoring a snapshot. */
export const VectorstoreRestored = z.looseObject({
  vectorstore: z.string(),
  restored: z.string(),
  vectorCount: z.number().int().nullish(),
});
export type VectorstoreRestored = z.infer<typeof VectorstoreRestored>;
