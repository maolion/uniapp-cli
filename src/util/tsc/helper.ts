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

const supportedTypeScriptExtensions = ['.ts', '.tsx', '.d.ts'];

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

export function contains<T>(array: T[], value: T): boolean {
  if (array) {
    for (const v of array) {
      if (v === value) {
        return true;
      }
    }
  }
  return false;
}

export function arrayIsEqualTo<T>(array1: T[], array2: T[], equaler?: (a: T, b: T) => boolean): boolean {
  if (!array1 || !array2) {
    return false;
  }

  if (array1.length !== array2.length) {
    return false;
  }

  for (let i = 0, l = array1.length; i < l; i++) {
    let a = array1[i];
    let b = array2[i];

    if (!(equaler ? equaler(a, b) : a === b)) {
      return false;
    }
  }

  return true;
}

export function isSupportedSourceFileName(fileName: string) {
  if (!fileName) {
    return false;
  }

  let fileNameStrLen = fileName.length;

  for (let extension of supportedTypeScriptExtensions) {
    if (fileNameStrLen > extension.length && fileName.endsWith(extension)) {
      return true;
    }
  }

  return false;
}

export function padLeft(s: string, length: number) {
  while (s.length < length) {
    s = ' ' + s;
  }
  return s;
}

export function padRight(s: string, length: number) {
  while (s.length < length) {
    s = s + ' ';
  }

  return s;
}
