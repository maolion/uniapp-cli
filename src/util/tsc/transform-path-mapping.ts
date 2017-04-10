import * as Path from 'path';

import {
  EmitHint,
  Expression,
  Identifier,
  ImportDeclaration,
  ModuleKind,
  Node,
  SourceFile,
  SyntaxKind,
  TransformationContext,
  getOriginalNode,
  sys
} from 'typescript';

import {
  getEmitModuleKind,
  getRelativePath
} from './helper';

import {
  typeScriptSupportFileExtRegx
} from './types';

export default function transformPathMapping(context: TransformationContext) {
  const compilerOptions = context.getCompilerOptions();
  const baseUrl = compilerOptions.baseUrl || sys.getCurrentDirectory();
  const moduleKind = getEmitModuleKind(compilerOptions);
  const isCommonJSModuleKind = moduleKind === ModuleKind.CommonJS;

  let previousOnSubstituteNode: typeof context.onSubstituteNode;
  let currentSourceFile: SourceFile;
  let needSubstitutionModulePath = false;
  let moduleFileNameMapping: Map<string, string>;

  if (isCommonJSModuleKind) {
    moduleFileNameMapping = new Map();
    previousOnSubstituteNode = context.onSubstituteNode;

    context.onSubstituteNode = onSubstituteNode;
    context.enableSubstitution(SyntaxKind.StringLiteral);
    context.enableSubstitution(SyntaxKind.RequireKeyword);
  }

  return transformSourceFile;

  function transformSourceFile(node: SourceFile) {
    currentSourceFile = node;
    return node;
  }

  function onSubstituteNode(hint: EmitHint, node: Node) {
    node = previousOnSubstituteNode(hint, node);

    if (node.kind === SyntaxKind.Identifier) {
      let identifier = node as Identifier;

      if (identifier.originalKeywordKind === SyntaxKind.RequireKeyword) {
        needSubstitutionModulePath = true;
        return node;
      }

    }

    if (needSubstitutionModulePath) {
      needSubstitutionModulePath =  false;
      return substitutionModulePath(node);
    }

    return node;
  }

  function substitutionModulePath(node: Node) {
    let identifier = node as Identifier;
    let moduleFileName = moduleFileNameMapping.get(identifier.text);

    if (moduleFileName) {
      identifier.text = moduleFileName;
      return node;
    }

    let resolvedModules = (currentSourceFile as any).resolvedModules;

    if (!resolvedModules) {
      return node;
    }

    let resolvedModule = resolvedModules.get(identifier.text);

    if (!resolvedModule || !resolvedModule.resolvedFileName) {
      return node;
    }

    moduleFileName = getRelativePath(baseUrl, resolvedModule.resolvedFileName)
      .replace(typeScriptSupportFileExtRegx, '.js');

    moduleFileNameMapping.set(identifier.text, moduleFileName);

    identifier.text = moduleFileName;

    return node;
  }
}
