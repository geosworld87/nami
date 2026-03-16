import { NamiGraphSchema, type NamiGraph } from "./model.js";

export function serialize(graph: NamiGraph): string {
  return JSON.stringify(graph, null, 2);
}

export function deserialize(json: string): NamiGraph {
  const data: unknown = JSON.parse(json);
  return NamiGraphSchema.parse(data);
}
