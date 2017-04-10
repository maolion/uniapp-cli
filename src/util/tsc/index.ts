import * as FS from 'fs-extra';
import * as Path from 'path';
import {
  CompilerHost,
  CompilerOptions,
  Diagnostic,
  ExitStatus,
  FileWatcher,
  Node,
  ParsedCommandLine,
  Program,
  ScriptTarget,
  SourceFile as _SourceFile,
  createCompilerHost,
  createProgram,
  parseConfigFileTextToJson,
  parseJsonConfigFileContent,
  sys
} from 'typescript';

import { readFile } from '../fs';

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

export default function tsc(configFileName: string, options: TSCOptions = {}) {
  const watchSet = !!options.watch;
  const cwd = options.cwd || sys.getCurrentDirectory();

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
        // TODO: report read config file exception
        console.error('read config file exception');
        sys.exit(ExitStatus.DiagnosticsPresent_OutputsSkipped);
      }
    }

    if (!cachedConfigFileText) {
      console.error('read config file exception');
      sys.exit(ExitStatus.DiagnosticsPresent_OutputsSkipped);
      return;
    }

    const result = parseConfigFileTextToJson(configFileName, cachedConfigFileText);
    const configObject = result.config;

    if (!configObject) {
      console.error(result.error);
      sys.exit(ExitStatus.DiagnosticsPresent_OutputsSkipped);
      return;
    }

    const configParseResult = parseJsonConfigFileContent(
      configObject,
      sys,
      Path.dirname(configFileName)
    );

    if (configParseResult.errors.length > 0) {
      console.error(configParseResult.errors);
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

    cachedExistingFiles = new Map<string, boolean>();

    const compileResult = compile(rootFileNames, compilerOptions, compilerHost);

    if (!watchSet) {
      return sys.exit(compileResult.exitStatus);
    }

    setCachedProgram(compileResult.program);

    // TODO: report watching file change
    console.log('watching... file change...');
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
    console.log('recompile');
    performCompilation();
  }
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

    // TODO: report diagnostics
    console.log(diagnostics);

    if (emitOutput.emitSkipped && diagnostics.length > 0) {
      return ExitStatus.DiagnosticsPresent_OutputsSkipped;
    } else if (diagnostics.length > 0) {
      return ExitStatus.DiagnosticsPresent_OutputsGenerated;
    }

    return ExitStatus.Success;
  }

}

// Helpers

function contains<T>(array: T[], value: T): boolean {
    if (array) {
        for (const v of array) {
            if (v === value) {
                return true;
            }
        }
    }
    return false;
}

function arrayIsEqualTo<T>(array1: T[], array2: T[], equaler?: (a: T, b: T) => boolean): boolean {
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

function isSupportedSourceFileName(fileName: string) {
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
