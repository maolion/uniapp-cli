import * as Chalk from 'chalk';
import * as FS from 'fs-extra';
import * as Path from 'path';

import {
  CompilerHost,
  CompilerOptions,
  Diagnostic,
  DiagnosticCategory,
  ExitStatus,
  FileWatcher,
  FormatDiagnosticsHost,
  Node,
  ParsedCommandLine,
  Program,
  ScriptTarget,
  SourceFile as _SourceFile,
  createCompilerHost,
  createProgram,
  flattenDiagnosticMessageText,
  formatDiagnostics,
  getLineAndCharacterOfPosition,
  getPositionOfLineAndCharacter,
  parseConfigFileTextToJson,
  parseJsonConfigFileContent,
  sys
} from 'typescript';

import { readFile } from '../fs';

import {
  arrayIsEqualTo,
  contains,
  getRelativePath,
  isSupportedSourceFileName,
  padLeft,
  padRight
} from './helper';

import transformPathMapping from './transform-path-mapping';

const NL = sys.newLine;

const supportedTypeScriptExtensions = ['.ts', '.tsx', '.d.ts'];

interface Statistic {
  name: string;
  value: string;
}

export interface TSCOptions {
  watch?: boolean;
  cwd?: string;
}

export interface SourceFile extends _SourceFile {
  fileWatcher?: FileWatcher;
}

type ErrorHandler = (message: string) => void;

const redForegroundEscapeSequence = '\u001b[91m';
const yellowForegroundEscapeSequence = '\u001b[93m';
const blueForegroundEscapeSequence = '\u001b[93m';
const gutterStyleSequence = '\u001b[100;30m';
const gutterSeparator = ' ';
const resetEscapeSequence = '\u001b[0m';
const ellipsis = '...';

/** 自定义 tsc, 主要用于完成 path mapping 路径映射到实际的关联文件模块需求 */
export default function tsc(configFileName: string, options: TSCOptions = {}) {
  const watchSet = !!options.watch;
  const cwd = options.cwd || sys.getCurrentDirectory();
  const defaultFormatDiagnosticsHost: FormatDiagnosticsHost = {
    getCurrentDirectory: () => sys.getCurrentDirectory(),
    getNewLine: () => sys.newLine,
    getCanonicalFileName: (
      sys.useCaseSensitiveFileNames ?
        (fileName => fileName) :
        (fileName => fileName.toLowerCase())
    )
  };

  let cachedConfigFileText: string | undefined;
  let compilerOptions: CompilerOptions;
  let configFileWatcher: FileWatcher;
  let directoryWatcher: FileWatcher;
  let cachedProgram: Program | undefined;
  let compilerHost: CompilerHost;
  let hostGetSourceFile: typeof compilerHost.getSourceFile;
  let timerHandleForRecompilation: any;
  let timerHandleForDirectoryChanges: any;
  let rootFileNames: string[];

  let cachedExistingFiles: Map<string, boolean>;
  let hostFileExists: typeof compilerHost.fileExists;
  let reportDiagnosticWorker = reportDiagnosticSimply;

  configFileName = Path.resolve(cwd, configFileName);

  // 监听 tsconfig.json 和 对应目录ts项目源代码目录的文件变动情况
  // 监听文件变通主要是触发实时编译的需求
  if (watchSet) {
    if (sys.watchFile) {
      configFileWatcher = sys.watchFile(configFileName, configFileChanged);
    }

    if (sys.watchDirectory) {
      directoryWatcher = sys.watchDirectory(
        Path.dirname(configFileName),
        watchedDirectoryChanged,
        true
      );
    }
  }

  performCompilation();

  function parseConfigFile() {

    if (!cachedConfigFileText) {
      try {
        cachedConfigFileText = readFile(configFileName);
      } catch (e) {
        reportWatchDiagnostic({
          messageText: `Can not read file ${configFileName}: ${e.message}.`
        } as Diagnostic);

        sys.exit(ExitStatus.DiagnosticsPresent_OutputsSkipped);
      }
    }

    if (!cachedConfigFileText) {
      reportWatchDiagnostic({
        messageText: `File ${configFileName} not found.`
      } as Diagnostic);

      sys.exit(ExitStatus.DiagnosticsPresent_OutputsSkipped);
      return;
    }

    // 解析 项目配置文件, 修正编译参数配置，搜索所有编译目标文件

    const result = parseConfigFileTextToJson(configFileName, cachedConfigFileText);
    const configObject = result.config;
    if (!configObject) {
      if (result.error) {
        reportDiagnostics([result.error]);
      }

      sys.exit(ExitStatus.DiagnosticsPresent_OutputsSkipped);
      return;
    }

    const configParseResult = parseJsonConfigFileContent(
      configObject,
      sys,
      Path.dirname(configFileName)
    );

    if (configParseResult.errors.length > 0) {
      reportDiagnostics(configParseResult.errors);
      sys.exit(ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }

    return configParseResult;
  }

  function performCompilation() {

    if (!cachedProgram) {
      const configParseResult = (parseConfigFile() as ParsedCommandLine);
      rootFileNames = configParseResult.fileNames;
      compilerOptions = configParseResult.options;

      compilerHost = createCompilerHost(compilerOptions);
      hostGetSourceFile = compilerHost.getSourceFile;
      compilerHost.getSourceFile = getSourceFile;

      hostFileExists = compilerHost.fileExists;
      compilerHost.fileExists = cachedFileExists;
    }

    if (compilerOptions.pretty) {
      reportDiagnosticWorker = reportDiagnosticPretty;
    }

    cachedExistingFiles = new Map<string, boolean>();

    const compileResult = compile(rootFileNames, compilerOptions, compilerHost);

    if (!watchSet) {
      return sys.exit(compileResult.exitStatus);
    }

    setCachedProgram(compileResult.program);

    reportWatchDiagnostic({
      messageText: 'Compilation complete. Watching for file changes.'
    } as Diagnostic);
  }

  function cachedFileExists(fileName: string): boolean {
    let fileExists = cachedExistingFiles.get(fileName);

    if (fileExists === undefined) {
      cachedExistingFiles.set(fileName, fileExists = hostFileExists(fileName));
    }

    return fileExists;
  }

  function getSourceFile(fileName: string, languageVersion: ScriptTarget, onError?: ErrorHandler): SourceFile {
    if (cachedProgram) {
      const sourceFile = cachedProgram.getSourceFile(fileName) as SourceFile;

      // 使用已被处理过的文件缓存数据
      if (sourceFile && sourceFile.fileWatcher) {
        return sourceFile;
      }
    }

    const sourceFile = hostGetSourceFile(fileName, languageVersion, onError) as SourceFile;

    if (sourceFile && watchSet && sys.watchFile) {
      sourceFile.fileWatcher = sys.watchFile(sourceFile.fileName, (_fileName: string, removed?: boolean) => {
        sourceFileChanged(sourceFile, removed);
      });
    }

    return sourceFile;
  }

  function setCachedProgram(program: Program | undefined) {
    const newSourceFiles = program ? program.getSourceFiles() : undefined;

    if (cachedProgram && newSourceFiles) {
      const sourceFiles = cachedProgram.getSourceFiles() as SourceFile[];

      sourceFiles.forEach(sourceFile => {
        if (contains(newSourceFiles, sourceFile)) {
          return;
        }

        // 不在编译目标文件范围内的老文件缓存数据被清掉
        if (sourceFile.fileWatcher) {
          sourceFile.fileWatcher.close();
          sourceFile.fileWatcher = undefined;
        }
      });
    }

    cachedProgram = program;
  }

  function sourceFileChanged(sourceFile: SourceFile, removed?: boolean) {
    if (sourceFile.fileWatcher) {
      sourceFile.fileWatcher.close();
      sourceFile.fileWatcher = undefined;
    }

    if (removed) {
      rootFileNames.splice(rootFileNames.indexOf(sourceFile.fileName), 1);
    }

    startTimerForRecompilation();
  }

  function configFileChanged() {
    // 因为项目配置文件的改动，所以 不在使用缓存数据
    setCachedProgram(undefined);
    cachedConfigFileText = undefined;

    startTimerForRecompilation();
  }

  function watchedDirectoryChanged(fileName: string) {
    if (fileName && !isSupportedSourceFileName(fileName)) {
      return;
    }

    if (timerHandleForDirectoryChanges) {
      clearTimeout(timerHandleForDirectoryChanges);
    }

    timerHandleForDirectoryChanges = setTimeout(directoryChangeHandler, 250);
  }

  function directoryChangeHandler() {
    const parsedCommandLine = parseConfigFile() as ParsedCommandLine;
    const newFileNames = parsedCommandLine.fileNames.map(compilerHost.getCanonicalFileName);
    const canonicalRootFileNames = rootFileNames.map(compilerHost.getCanonicalFileName);

    if (!arrayIsEqualTo(newFileNames.sort(), canonicalRootFileNames.sort())) {
      setCachedProgram(undefined);
      startTimerForRecompilation();
    }
  }

  function startTimerForRecompilation() {
    if (timerHandleForRecompilation) {
      clearTimeout(timerHandleForRecompilation);
    }

    timerHandleForRecompilation = setTimeout(recompile, 250);
  }

  function recompile() {
    timerHandleForRecompilation = undefined;

    reportWatchDiagnostic({
      messageText: 'File change detected. Starting incremental compilation...'
    } as Diagnostic);

    performCompilation();
  }

  function compile(fileNames: string[], compilerOptions: CompilerOptions, compilerHost: CompilerHost) {
    const program = createProgram(fileNames, compilerOptions, compilerHost);
    const exitStatus = compilerProgram();

    return {
      program,
      exitStatus
    };

    function compilerProgram() {
      let diagnostics: Diagnostic[];
      diagnostics = program.getSyntacticDiagnostics();

      if (diagnostics.length === 0) {
        diagnostics = program.getOptionsDiagnostics().concat(program.getGlobalDiagnostics());

        if (diagnostics.length === 0) {
          diagnostics = program.getSemanticDiagnostics();
        }
      }

      const emitOutput = program.emit(
        undefined,
        undefined,
        undefined,
        undefined,
        {
          after: [
            transformPathMapping
          ]
        }
      );

      diagnostics = diagnostics.concat(emitOutput.diagnostics);

      reportDiagnostics(diagnostics);

      if (emitOutput.emitSkipped && diagnostics.length > 0) {
        return ExitStatus.DiagnosticsPresent_OutputsSkipped;
      } else if (diagnostics.length > 0) {
        return ExitStatus.DiagnosticsPresent_OutputsGenerated;
      }

      return ExitStatus.Success;
    }
  }

  function reportDiagnostic(diagnostic: Diagnostic, host?: FormatDiagnosticsHost) {
    reportDiagnosticWorker(diagnostic, host || defaultFormatDiagnosticsHost);
  }

  function reportDiagnostics(diagnostics: Diagnostic[], host?: FormatDiagnosticsHost): void {
    for (const diagnostic of diagnostics) {
      reportDiagnostic(diagnostic, host);
    }
  }
}

function reportDiagnosticSimply(diagnostic: Diagnostic, host: FormatDiagnosticsHost) {
  sys.write(formatDiagnostics([diagnostic], host));
}

function formatAndReset(text: string, formatStyle: string) {
  return formatStyle + text + resetEscapeSequence;
}

function diagnosticCategoryText(category: DiagnosticCategory): string {
  const text = DiagnosticCategory[category].toLowerCase();

  let colorWrapper: (text?: string) => string = String;

  switch (category) {
    case DiagnosticCategory.Warning: colorWrapper = Chalk.yellow; break;
    case DiagnosticCategory.Error: colorWrapper = Chalk.red; break;
    case DiagnosticCategory.Message: colorWrapper = Chalk.blue; break;
  }

  return colorWrapper(text);
}

function reportDiagnosticPretty(diagnostic: Diagnostic, host: FormatDiagnosticsHost) {
  let output: string = '';

  // 排版 出错位置定位 打印信息
  if (diagnostic.file) {
    const { start, length, file } = diagnostic;
    const { line: firstLine, character: firstLineChar } = getLineAndCharacterOfPosition(file, start);
    const { line: lastLine, character: lastLineChar } = getLineAndCharacterOfPosition(file, start + length);
    const lastLineInFile = getLineAndCharacterOfPosition(file, file.text.length).line;
    const relativeFileName = host ? getRelativePath(host.getCurrentDirectory(), file.fileName) : file.fileName;

    const hasMoreThanFiveLines = (lastLine - firstLine) >= 4;
    let gutterWidth = (lastLine + 1 + '').length;

    if (hasMoreThanFiveLines) {
      gutterWidth = Math.max(ellipsis.length, gutterWidth);
    }

    output += NL;
    for (let i = firstLine; i <= lastLine; i++) {
      if (hasMoreThanFiveLines && firstLine + 1 < i && i < lastLine - 1) {
        output +=
          (formatAndReset(padLeft(ellipsis, gutterWidth), gutterStyleSequence)
            + gutterSeparator
            + NL);

        i = lastLine - 1;
      }

      const lineStart = getPositionOfLineAndCharacter(file, i, 0);
      const lineEnd = i < lastLineInFile ? getPositionOfLineAndCharacter(file, i + 1, 0) : file.text.length;
      let lineContent = file.text.slice(lineStart, lineEnd);
      lineContent = lineContent.replace(/\s+$/g, '');
      lineContent = lineContent.replace('\t', ' ');

      output +=
        (`\u001b[100;30m${padLeft(i + 1 + '', gutterWidth)}\u001b[0m`
          + gutterSeparator
          + lineContent
          + NL
          // ----
          + formatAndReset(padLeft('', gutterWidth), gutterStyleSequence)
          + gutterSeparator);

      output += redForegroundEscapeSequence;
      if (i === firstLine) {
        const lastCharForLine = i === lastLine ? lastLineChar : undefined;

        output += lineContent.slice(0, firstLineChar).replace(/\S/g, ' ');
        output += lineContent.slice(firstLineChar, lastCharForLine).replace(/./g, '~');
      } else if (i === lastLine) {
        output += lineContent.slice(0, lastLineChar).replace(/./g, '~');
      } else {
        output += lineContent.replace(/./g, '~');
      }
      output += resetEscapeSequence;

      output += sys.newLine;
    }

    output += sys.newLine;
    output += `${relativeFileName}(${firstLine + 1},${firstLineChar + 1}): `;
  }

  output +=
    (`${diagnosticCategoryText(diagnostic.category)} `
      + `TS${diagnostic.code} ${flattenDiagnosticMessageText(diagnostic.messageText, NL)}`
      + NL
      + NL);

  sys.write(output);
}

function reportEmittedFiles(files: string[]): void {
  if (!files || files.length === 0) {
    return;
  }

  const currentDir = sys.getCurrentDirectory();

  for (const file of files) {
    const filepath = Path.resolve(currentDir, file);

    sys.write(`TSFILE: ${filepath}${NL}`);
  }
}

function reportWatchDiagnostic(diagnostic: Diagnostic) {
  let output = new Date().toLocaleTimeString() + ' - ';

  if (diagnostic.file) {
    const loc = getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
    output += `${diagnostic.file.fileName}(${loc.line + 1},${loc.character + 1}): `;
  }

  output +=
    (`${flattenDiagnosticMessageText(diagnostic.messageText, NL)}`
      + NL
      + NL
      + NL);

  sys.write(output);
}
