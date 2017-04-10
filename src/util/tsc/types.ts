import {
  Identifier as _Identifier,
  Node,
  PrimaryExpression,
  SyntaxKind
} from 'typescript';

export const typeScriptSupportFileExtRegx = /\.?(?:d\.ts|ts|tsx)$/i;

export const enum TransformFlags {
  None = 0,

  ContainsTypeScript = 1 << 1,

  HasComputedFlags = 1 << 29,

  TypeExcludes = ~ContainsTypeScript
}

export interface Node extends Node {
  transformFlags?: any;
  emitNode?: any;
}

export const enum GeneratedIdentifierKind {
  None,
  Auto,
  Loop,
  Unique,
  Node,
}

export interface Identifier extends _Identifier {
  autoGenerateKind?: GeneratedIdentifierKind;
  autoGenerateId?: number;
}
