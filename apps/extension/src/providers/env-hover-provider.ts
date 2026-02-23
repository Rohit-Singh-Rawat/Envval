import {
  CancellationToken,
  Hover,
  HoverProvider,
  MarkdownString,
  Position,
  TextDocument,
} from "vscode";
import { EnvCacheService, EnvVariable } from "../services/env-cache";
import { Logger } from "../utils/logger";
import { getHoverConfig, HoverConfig } from "../lib/config";

interface LanguagePattern {
  pattern: RegExp;
  extractKey: (match: RegExpMatchArray) => string | null;
}

const LANGUAGE_PATTERNS: Record<string, LanguagePattern[]> = {
  javascript: [
    {
      pattern: /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /env\.['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /process\.env\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)/g,
      extractKey: (m) => m[1],
    },
  ],
  typescript: [
    {
      pattern: /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /env\.['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /process\.env\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)/g,
      extractKey: (m) => m[1],
    },
  ],
  python: [
    {
      pattern: /os\.environ\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /os\.environ\.get\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /os\.getenv\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,
      extractKey: (m) => m[1],
    },
  ],
  ruby: [
    {
      pattern: /ENV\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /ENV\.fetch\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,
      extractKey: (m) => m[1],
    },
  ],
  go: [
    {
      pattern: /os\.Getenv\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /os\.LookupEnv\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      extractKey: (m) => m[1],
    },
  ],
  php: [
    {
      pattern: /\$_ENV\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /\$_SERVER\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /getenv\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      extractKey: (m) => m[1],
    },
  ],
  rust: [
    {
      pattern: /std::env::var\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /env::var\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      extractKey: (m) => m[1],
    },
  ],
  java: [
    {
      pattern: /System\.getenv\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      extractKey: (m) => m[1],
    },
  ],
  csharp: [
    {
      pattern:
        /Environment\.GetEnvironmentVariable\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      extractKey: (m) => m[1],
    },
  ],
  shellscript: [
    {
      pattern: /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /\$([A-Za-z_][A-Za-z0-9_]*)/g,
      extractKey: (m) => m[1],
    },
  ],
  dockerfile: [
    {
      pattern: /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /\$([A-Za-z_][A-Za-z0-9_]*)/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /ENV\s+([A-Za-z_][A-Za-z0-9_]*)/g,
      extractKey: (m) => m[1],
    },
  ],
  kotlin: [
    {
      pattern: /System\.getenv\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      extractKey: (m) => m[1],
    },
  ],
  elixir: [
    {
      pattern: /System\.get_env\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g,
      extractKey: (m) => m[1],
    },
  ],
  dart: [
    {
      pattern: /Platform\.environment\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
      extractKey: (m) => m[1],
    },
    {
      pattern: /String\.fromEnvironment\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,
      extractKey: (m) => m[1],
    },
  ],
};

// Fallback pattern for any language - matches standalone uppercase identifiers
const FALLBACK_PATTERN: LanguagePattern = {
  pattern: /\b([A-Z][A-Z0-9_]{2,})\b/g,
  extractKey: (m) => m[1],
};

const SENSITIVE_PATTERNS = [
  "KEY",
  "SECRET",
  "PASSWORD",
  "TOKEN",
  "CREDENTIAL",
  "AUTH",
  "PRIVATE",
];

export class EnvHoverProvider implements HoverProvider {
  private readonly envCache: EnvCacheService;
  private readonly logger: Logger;

  constructor(envCache: EnvCacheService, logger: Logger) {
    this.envCache = envCache;
    this.logger = logger;
  }

  public async provideHover(
    document: TextDocument,
    position: Position,
    _token: CancellationToken,
  ): Promise<Hover | null> {
    const config = getHoverConfig();
    if (!config.enabled) {
      return null;
    }

    await this.envCache.ensureInitialized();

    const line = document.lineAt(position.line).text;
    const languageId = this.normalizeLanguageId(document.languageId);

    const envKey = this.findEnvKeyAtPosition(
      line,
      position.character,
      languageId,
    );
    if (!envKey) {
      return null;
    }

    const variables = this.envCache.getVariable(envKey);
    if (variables.length === 0 && !config.showUndefined) {
      return null;
    }

    const markdown = this.buildHoverContent(envKey, variables, config);
    return new Hover(markdown);
  }

  private normalizeLanguageId(languageId: string): string {
    const aliases: Record<string, string> = {
      javascriptreact: "javascript",
      typescriptreact: "typescript",
      vue: "javascript",
      svelte: "javascript",
      sh: "shellscript",
      bash: "shellscript",
      zsh: "shellscript",
    };
    return aliases[languageId] || languageId;
  }

  private findEnvKeyAtPosition(
    line: string,
    character: number,
    languageId: string,
  ): string | null {
    const patterns = LANGUAGE_PATTERNS[languageId] || [];

    // Try language-specific patterns first
    for (const { pattern, extractKey } of patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(line)) !== null) {
        const key = extractKey(match);
        if (!key) {
          continue;
        }

        const keyStart = match[0].lastIndexOf(key);
        const absoluteStart = match.index + keyStart;
        const absoluteEnd = absoluteStart + key.length;

        if (character >= absoluteStart && character <= absoluteEnd) {
          return key;
        }
      }
    }

    // Fallback: check if hovering over an uppercase identifier that exists in cache
    FALLBACK_PATTERN.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = FALLBACK_PATTERN.pattern.exec(line)) !== null) {
      const key = FALLBACK_PATTERN.extractKey(match);
      if (!key) {
        continue;
      }

      const start = match.index;
      const end = start + key.length;

      if (
        character >= start &&
        character <= end &&
        this.envCache.hasVariable(key)
      ) {
        return key;
      }
    }

    return null;
  }

  private buildHoverContent(
    key: string,
    variables: EnvVariable[],
    config: HoverConfig,
  ): MarkdownString {
    const md = new MarkdownString();
    md.supportHtml = true;
    md.isTrusted = true;

    md.appendMarkdown(`**\`${key}\`**\n\n`);

    if (variables.length === 0) {
      md.appendMarkdown(`⚠️ *Not defined in any .env file*\n`);
      return md;
    }

    // Build table with file locations and values
    md.appendMarkdown("| File | Value |\n");
    md.appendMarkdown("|:-----|:------|\n");

    for (const variable of variables) {
      const displayValue = this.formatValue(variable, config);
      const fileDisplay = `${variable.fileName}:${variable.lineNumber}`;
      md.appendMarkdown(`| \`${fileDisplay}\` | \`${displayValue}\` |\n`);
    }

    md.appendMarkdown("\n---\n");
    md.appendMarkdown("*EnvVal*");

    return md;
  }

  private formatValue(variable: EnvVariable, config: HoverConfig): string {
    if (!config.showValues) {
      return "••••••••";
    }

    const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
      variable.key.toUpperCase().includes(pattern),
    );

    if (isSensitive && config.maskSensitive) {
      return this.maskValue(variable.value);
    }

    return this.escapeMarkdown(variable.value);
  }

  private maskValue(value: string): string {
    if (value.length <= 4) {
      return "****";
    }
    return value.slice(0, 4) + "••••";
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[|`\\]/g, "\\$&");
  }
}

export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "javascriptreact",
  "typescriptreact",
  "python",
  "ruby",
  "go",
  "php",
  "rust",
  "java",
  "csharp",
  "shellscript",
  "dockerfile",
  "kotlin",
  "elixir",
  "dart",
  "vue",
  "svelte",
  "yaml",
  "json",
  "plaintext",
];
