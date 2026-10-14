/**
 * Guardrails: checks that the platform runs on prompts and on the LLM's replies.
 *
 * @example
 * ```ts
 * const result = await client.guardrails.evaluate(17, "My card is 4111 1111 1111 1111");
 * if (result.triggered) console.log(result.disposition, result.text);
 * ```
 */

import type { RequestOptions } from "../core/http.ts";
import type { SmarterId } from "../core/typing.ts";
import { Guardrail, GuardrailEvaluation, GuardrailEvents } from "../models/guardrail.ts";
import { resourceId, SmarterKindResource } from "./base.ts";

/** The stage of a prompt that a Guardrail runs on: the prompt (`input`) or the LLM's reply (`output`). */
export type GuardrailStage = "input" | "output";

/** Guardrails: `/api/v1/guardrails/`, and the manifest api's `Guardrail` kind. */
export class Guardrails extends SmarterKindResource<typeof Guardrail> {
  readonly kind = "Guardrail";
  readonly path = "guardrails/";
  readonly model = Guardrail;

  /**
   * Dry-run a Guardrail on a text, without saving an event.
   *
   * @param id - The Guardrail's id or hashed id.
   * @param text - The text, e.g. a prompt (`input`) or an LLM's reply (`output`).
   * @param options - `stage`: the stage to evaluate the text as, `input` by default. The Guardrail must run on it.
   * @returns Whether it triggered, its disposition, and the text after its action.
   * @throws {@link BadRequestError} If the text is empty or too long, or the Guardrail does not run on the stage.
   */
  async evaluate(
    id: SmarterId,
    text: string,
    options?: RequestOptions & { stage?: GuardrailStage },
  ): Promise<GuardrailEvaluation> {
    return this.http.request("POST", `${this.path}${resourceId(id)}/evaluate/`, GuardrailEvaluation, {
      ...options,
      json: { text, stage: options?.stage ?? "input" },
    });
  }

  /**
   * The latest events of a Guardrail that the user owns.
   *
   * @param id - The Guardrail's id or hashed id.
   * @param options - `reviewed`: only reviewed (true) or unreviewed (false) events. `disposition`: only events of this disposition, e.g. `blocked`.
   * @returns The events, newest first.
   */
  async events(
    id: SmarterId,
    options?: RequestOptions & { reviewed?: boolean | null; disposition?: string | null },
  ): Promise<GuardrailEvents> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/events/`, GuardrailEvents, {
      ...options,
      params: { reviewed: options?.reviewed, disposition: options?.disposition },
    });
  }
}
