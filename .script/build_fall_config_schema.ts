import Ajv from "npm:ajv@8.13.0";
import { parse } from "jsr:@std/yaml@0.224.0";
import { fromFileUrl } from "jsr:@std/path@0.225.1";

function compileSchema(content: string): string {
  const schema = parse(content);
  // Try compile to check if the schema is valid
  // @ts-ignore: Ajv is a constructor but TS doesn't know it
  const ajv = new Ajv({ strict: true });
  ajv.compile(schema);
  // It seems the schema is valid so output JSON
  return JSON.stringify(schema, null, 2);
}

function compileSchemaFile(path: string): void {
  const content = Deno.readTextFileSync(path);
  const outPath = path.replace(/.yaml$/, ".json");
  const json = compileSchema(content);
  Deno.writeTextFileSync(outPath, json);
}

function main(): void {
  const schemas = [
    "../denops/fall/config/extension/schema.yaml",
    "../denops/fall/config/picker/schema.yaml",
    "../denops/fall/config/style/schema.yaml",
  ];
  schemas.forEach((v) =>
    compileSchemaFile(fromFileUrl(import.meta.resolve(v)))
  );
}

if (import.meta.main) {
  main();
}
