import * as Path from 'path';

import {
  CompilerOptions,
  EmitFlags,
  ModuleKind,
  ScriptTarget,
  SyntaxKind
} from 'typescript';

import {
  Identifier,
  Node,
  TransformFlags
} from './types';

export function isIdentifier(node: Node): node is Identifier {
  return node.kind === SyntaxKind.Identifier;
}

export function getEmitScriptTarget(compilerOptions: CompilerOptions) {
  return compilerOptions.target || ScriptTarget.ES3;
}

export function getEmitModuleKind(compilerOptions: CompilerOptions) {
  return typeof compilerOptions.module === 'number' ?
    compilerOptions.module : (
      getEmitScriptTarget(compilerOptions) >= ScriptTarget.ES2015 ?
        ModuleKind.ES2015 :
        ModuleKind.CommonJS
    );
}

export function getRelativePath(from: string, to: string) {
  let path = Path.relative(from, to);
  if (path && path.charAt(0) !== '.') {
    path = './' + path;
  }

  return path;
}
