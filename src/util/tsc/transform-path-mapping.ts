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

  // 只针对 uniapp 目前选择的JS模板管理形式
  if (isCommonJSModuleKind) {
    moduleFileNameMapping = new Map();
    previousOnSubstituteNode = context.onSubstituteNode;

    context.onSubstituteNode = onSubstituteNode;

    // 开放需要被替换的语言语法对象
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

      // 找到 require(...) 标记
      if (identifier.originalKeywordKind === SyntaxKind.RequireKeyword) {
        needSubstitutionModulePath = true;
        return node;
      }

    }

    // 处理和替换 require(...) 参数
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

    // 危险使用，因为 resolvedModules 并不是 typescript 开放的api
    let resolvedModules = (currentSourceFile as any).resolvedModules;

    if (!resolvedModules) {
      return node;
    }

    let resolvedModule = resolvedModules.get(identifier.text);

    // 忽略 node.js 核心 和 node_modules内的 模板
    if (!resolvedModule || !resolvedModule.resolvedFileName || resolvedModule.isExternalLibraryImport) {
      return node;
    }

    moduleFileName = getRelativePath(baseUrl, resolvedModule.resolvedFileName)
      .replace(typeScriptSupportFileExtRegx, '.js');

    moduleFileNameMapping.set(identifier.text, moduleFileName);

    // 非推介方式实现的替换
    identifier.text = moduleFileName;

    return node;
  }
}
