import type { Settings, Op, Sheet } from "@fortune-sheet/core";

/** Message types sent from the parent page to the iframe */
export type IncomingMessageType =
  | "init"
  | "updateData"
  | "getData"
  | "getAllSheets"
  | "getSheet"
  | "setOptions"
  | "setCellValue"
  | "getCellValue"
  | "clearCell"
  | "setCellFormat"
  | "setCellValuesByRange"
  | "setCellFormatByRange"
  | "setSelection"
  | "getSelection"
  | "getSelectionCoordinates"
  | "getCellsByRange"
  | "insertRowOrColumn"
  | "deleteRowOrColumn"
  | "hideRowOrColumn"
  | "showRowOrColumn"
  | "setRowHeight"
  | "setColumnWidth"
  | "getRowHeight"
  | "getColumnWidth"
  | "mergeCells"
  | "cancelMerge"
  | "addSheet"
  | "deleteSheet"
  | "activateSheet"
  | "setSheetName"
  | "setSheetOrder"
  | "scroll"
  | "freeze"
  | "applyOp"
  | "undo"
  | "redo"
  | "calculateFormula"
  | "batchCallApis";

/** Message types sent from the iframe to the parent page */
export type OutgoingMessageType =
  | "ready"
  | "response"
  | "onChange"
  | "onOp"
  | "error";

export interface IncomingMessage {
  /** Message type */
  type: IncomingMessageType;
  /** Optional request ID for correlating responses */
  id?: string;
  /** Message payload, varies by type */
  payload?: unknown;
}

export interface OutgoingMessage {
  /** Message source identifier */
  source: "fortune-sheet-iframe";
  /** Message type */
  type: OutgoingMessageType;
  /** Optional request ID echoed from the incoming message */
  id?: string;
  /** Response payload, varies by type */
  payload?: unknown;
}

/** Payload for the "init" message */
export interface InitPayload {
  /** Workbook sheet data */
  data?: Sheet[];
  /** Additional fortune-sheet Settings (excluding data and non-serializable fields) */
  options?: Omit<Settings, "data" | "hooks" | "customToolbarItems" | "generateSheetId">;
}

/** Payload for the "setOptions" message */
export type SetOptionsPayload = Omit<
  Settings,
  "data" | "hooks" | "customToolbarItems" | "generateSheetId"
>;

export interface ApplyOpPayload {
  ops: Op[];
}

export interface SetCellValuePayload {
  row: number;
  column: number;
  value: unknown;
  options?: { id?: string; type?: string };
}

export interface GetCellValuePayload {
  row: number;
  column: number;
  options?: { id?: string; type?: string };
}

export interface ClearCellPayload {
  row: number;
  column: number;
  options?: { id?: string };
}

export interface SetCellFormatPayload {
  row: number;
  column: number;
  attr: string;
  value: unknown;
  options?: { id?: string };
}

export interface SetCellValuesByRangePayload {
  data: unknown[][];
  range: { row: [number, number]; column: [number, number] };
  options?: { id?: string };
}

export interface SetCellFormatByRangePayload {
  attr: string;
  value: unknown;
  range:
    | { row: [number, number]; column: [number, number] }
    | Array<{ row: [number, number]; column: [number, number] }>;
  options?: { id?: string };
}

export interface SetSelectionPayload {
  range: Array<{ row: [number, number]; column: [number, number] }>;
  options?: { id?: string };
}

export interface GetCellsByRangePayload {
  range: { row: [number, number]; column: [number, number] };
  options?: { id?: string };
}

export interface InsertRowOrColumnPayload {
  type: "row" | "column";
  index: number;
  count: number;
  direction?: "lefttop" | "rightbottom";
  options?: { id?: string };
}

export interface DeleteRowOrColumnPayload {
  type: "row" | "column";
  start: number;
  end: number;
  options?: { id?: string };
}

export interface HideShowRowOrColumnPayload {
  rowOrColInfo: string[];
  type: "row" | "column";
}

export interface SetRowHeightPayload {
  rowInfo: Record<string, number>;
  options?: { id?: string };
  custom?: boolean;
}

export interface SetColumnWidthPayload {
  columnInfo: Record<string, number>;
  options?: { id?: string };
  custom?: boolean;
}

export interface GetRowHeightPayload {
  rows: number[];
  options?: { id?: string };
}

export interface GetColumnWidthPayload {
  columns: number[];
  options?: { id?: string };
}

export interface MergeCellsPayload {
  ranges: Array<{ row: [number, number]; column: [number, number] }>;
  type: string;
  options?: { id?: string };
}

export interface CancelMergePayload {
  ranges: Array<{ row: [number, number]; column: [number, number] }>;
  options?: { id?: string };
}

export interface SheetOptions {
  id?: string;
}

export interface SetSheetNamePayload {
  name: string;
  options?: { id?: string };
}

export interface SetSheetOrderPayload {
  orderList: Record<string, number>;
}

export interface ScrollPayload {
  scrollLeft?: number;
  scrollTop?: number;
  targetRow?: number;
  targetColumn?: number;
}

export interface FreezePayload {
  type: "row" | "column" | "both";
  range: { row: number; column: number };
  options?: { id?: string };
}

export interface CalculateFormulaPayload {
  id?: string;
  range?: { row: [number, number]; column: [number, number] };
}

export interface BatchCallApisPayload {
  apiCalls: Array<{ name: string; args: unknown[] }>;
}
