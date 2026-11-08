import { execFileSync } from "node:child_process"
import { writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import openapiTS, { astToString } from "openapi-typescript"
import * as ts from "typescript"

function declaredHeader(member: ts.TypeElement) {
  return !ts.isIndexSignatureDeclaration(member)
}

function declaredResponseHeaders(context: ts.TransformationContext) {
  function visit(node: ts.Node): ts.Node {
    if (
      ts.isPropertySignature(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "headers" &&
      node.type &&
      ts.isTypeLiteralNode(node.type)
    ) {
      return ts.factory.updatePropertySignature(
        node,
        node.modifiers,
        node.name,
        node.questionToken,
        ts.factory.updateTypeLiteralNode(
          node.type,
          ts.factory.createNodeArray(node.type.members.filter(declaredHeader)),
        ),
      )
    }

    return ts.visitEachChild(node, visit, context)
  }

  return visit
}

function printDeclaration(node: ts.Node) {
  return astToString([node], {
    formatOptions: { removeComments: true },
  }).trimEnd()
}

const schema = await openapiTS(new URL("../openapi.json", import.meta.url))

const result = ts.transform(schema, [declaredResponseHeaders])

const source = `${result.transformed.map(printDeclaration).join("\n\n")}\n`

const output = new URL("../src/schema.gen.ts", import.meta.url)

result.dispose()

await writeFile(output, source)

execFileSync(process.execPath, ["fmt", "--no-script", fileURLToPath(output)], {
  stdio: "inherit",
})
