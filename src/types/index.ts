export type CompressResult = {
  output: string;
  beforeChars: number;
  afterChars: number;
  beforeTokensEstimate: number;
  afterTokensEstimate: number;
  savedChars: number;
  savedPercent: number;
};

export type CompressOptions = {
  maxBlankLines?: number;
  collapseSpaces?: boolean;
};

export type JsonCompressOptions = {
  allowPipeEscape?: boolean;
};

export type PackOptions = {
  out?: string;
  maxBytes?: number;
  allowLarge?: boolean;
  compressText?: boolean;
  compressJson?: boolean;
  cwd?: string;
  extraIgnore?: string[];
};

export type PackReportEntry = {
  path: string;
  beforeChars: number;
  afterChars: number;
};

export type PackResult = {
  output: string;
  outputPath?: string;
  filesIncluded: number;
  filesIgnored: number;
  beforeChars: number;
  afterChars: number;
  beforeTokensEstimate: number;
  afterTokensEstimate: number;
  savedChars: number;
  savedPercent: number;
  report: PackReportEntry[];
};

export type AnalyzeOptions = {
  maxBytes?: number;
  cwd?: string;
  extraIgnore?: string[];
};

export type BiggestFile = {
  path: string;
  bytes: number;
};

export type AnalyzeResult = {
  totalScanned: number;
  included: number;
  ignored: number;
  biggest: BiggestFile[];
  estimatedSavedChars: number;
  estimatedSavedPercent: number;
  jsonTableCandidates: string[];
  recommendedExcludes: string[];
};

export type TokenZeroConfig = {
  maxBytes: number;
  compressText: boolean;
  compressJson: boolean;
  out: string;
  ignore: string[];
};

export type ProxyOptions = {
  port?: number;
  host?: string;
  upstream?: string;
  compressText?: boolean;
  quiet?: boolean;
};

export type ProxyStats = {
  requests: number;
  beforeChars: number;
  afterChars: number;
  savedChars: number;
  savedTokensEstimate: number;
};
