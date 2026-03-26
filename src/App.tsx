import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import type { Settings, Op, Sheet } from "@fortune-sheet/core";
import type { WorkbookInstance } from "@fortune-sheet/react";
import type {
  IncomingMessage,
  OutgoingMessage,
  InitPayload,
  SetOptionsPayload,
  ApplyOpPayload,
  SetCellValuePayload,
  GetCellValuePayload,
  ClearCellPayload,
  SetCellFormatPayload,
  SetCellValuesByRangePayload,
  SetCellFormatByRangePayload,
  SetSelectionPayload,
  GetCellsByRangePayload,
  InsertRowOrColumnPayload,
  DeleteRowOrColumnPayload,
  HideShowRowOrColumnPayload,
  SetRowHeightPayload,
  SetColumnWidthPayload,
  GetRowHeightPayload,
  GetColumnWidthPayload,
  MergeCellsPayload,
  CancelMergePayload,
  SheetOptions,
  SetSheetNamePayload,
  SetSheetOrderPayload,
  ScrollPayload,
  FreezePayload,
  CalculateFormulaPayload,
  BatchCallApisPayload,
} from "./types";

const DEFAULT_DATA: Sheet[] = [{ name: "Sheet1" }];

/**
 * Determine the trusted parent origin for postMessage replies.
 *
 * Priority order:
 * 1. VITE_PARENT_ORIGIN env variable (set at build time for locked-down deployments).
 * 2. document.referrer origin (the page that loaded this iframe).
 * 3. Falls back to '*' only when neither is available (e.g. same-origin dev).
 */
function resolveParentOrigin(): string {
  const envOrigin = import.meta.env.VITE_PARENT_ORIGIN as string | undefined;
  if (envOrigin) return envOrigin;

  if (document.referrer) {
    try {
      return new URL(document.referrer).origin;
    } catch {
      // invalid referrer — fall through
    }
  }
  return "*";
}

const PARENT_ORIGIN = resolveParentOrigin();

function App() {
  const workbookRef = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>(DEFAULT_DATA);
  const [options, setOptions] = useState<
    Omit<Settings, "data" | "hooks" | "customToolbarItems" | "generateSheetId">
  >({});

  /** Post a message to the parent window */
  const postToParent = useCallback((msg: OutgoingMessage) => {
    window.parent.postMessage(msg, PARENT_ORIGIN);
  }, []);

  /** Post a response to the parent window */
  const respond = useCallback(
    (id: string | undefined, payload: unknown) => {
      postToParent({ source: "fortune-sheet-iframe", type: "response", id, payload });
    },
    [postToParent]
  );

  /** Post an error to the parent window */
  const sendError = useCallback(
    (id: string | undefined, message: string) => {
      postToParent({
        source: "fortune-sheet-iframe",
        type: "error",
        id,
        payload: { message },
      });
    },
    [postToParent]
  );

  const handleChange = useCallback(
    (sheets: Sheet[]) => {
      setData(sheets);
      postToParent({ source: "fortune-sheet-iframe", type: "onChange", payload: sheets });
    },
    [postToParent]
  );

  const handleOp = useCallback(
    (ops: Op[]) => {
      postToParent({ source: "fortune-sheet-iframe", type: "onOp", payload: ops });
    },
    [postToParent]
  );

  /** Handle incoming postMessage events */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const msg = event.data as IncomingMessage;
      if (!msg || typeof msg.type !== "string") return;

      const wb = workbookRef.current;
      const { type, id, payload } = msg;

      try {
        switch (type) {
          case "init": {
            const p = (payload ?? {}) as InitPayload;
            if (p.options) setOptions(p.options);
            if (p.data) setData(p.data);
            respond(id, { ok: true });
            break;
          }

          case "updateData": {
            const sheets = payload as Sheet[];
            setData(sheets);
            respond(id, { ok: true });
            break;
          }

          case "getData": {
            respond(id, wb?.getAllSheets() ?? data);
            break;
          }

          case "getAllSheets": {
            respond(id, wb?.getAllSheets() ?? data);
            break;
          }

          case "getSheet": {
            const sheetOpts = payload as SheetOptions | undefined;
            respond(id, wb?.getSheet(sheetOpts));
            break;
          }

          case "setOptions": {
            const newOpts = payload as SetOptionsPayload;
            setOptions((prev) => ({ ...prev, ...newOpts }));
            respond(id, { ok: true });
            break;
          }

          case "applyOp": {
            const p = payload as ApplyOpPayload;
            wb?.applyOp(p.ops);
            respond(id, { ok: true });
            break;
          }

          case "setCellValue": {
            const p = payload as SetCellValuePayload;
            wb?.setCellValue(p.row, p.column, p.value, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "getCellValue": {
            const p = payload as GetCellValuePayload;
            const value = wb?.getCellValue(p.row, p.column, p.options as never);
            respond(id, value);
            break;
          }

          case "clearCell": {
            const p = payload as ClearCellPayload;
            wb?.clearCell(p.row, p.column, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "setCellFormat": {
            const p = payload as SetCellFormatPayload;
            wb?.setCellFormat(p.row, p.column, p.attr as never, p.value, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "setCellValuesByRange": {
            const p = payload as SetCellValuesByRangePayload;
            wb?.setCellValuesByRange(p.data, p.range as never, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "setCellFormatByRange": {
            const p = payload as SetCellFormatByRangePayload;
            wb?.setCellFormatByRange(p.attr as never, p.value, p.range as never, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "setSelection": {
            const p = payload as SetSelectionPayload;
            wb?.setSelection(p.range as never, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "getSelection": {
            respond(id, wb?.getSelection());
            break;
          }

          case "getSelectionCoordinates": {
            respond(id, wb?.getSelectionCoordinates());
            break;
          }

          case "getCellsByRange": {
            const p = payload as GetCellsByRangePayload;
            respond(id, wb?.getCellsByRange(p.range as never, p.options as never));
            break;
          }

          case "insertRowOrColumn": {
            const p = payload as InsertRowOrColumnPayload;
            wb?.insertRowOrColumn(p.type, p.index, p.count, p.direction, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "deleteRowOrColumn": {
            const p = payload as DeleteRowOrColumnPayload;
            wb?.deleteRowOrColumn(p.type, p.start, p.end, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "hideRowOrColumn": {
            const p = payload as HideShowRowOrColumnPayload;
            wb?.hideRowOrColumn(p.rowOrColInfo, p.type);
            respond(id, { ok: true });
            break;
          }

          case "showRowOrColumn": {
            const p = payload as HideShowRowOrColumnPayload;
            wb?.showRowOrColumn(p.rowOrColInfo, p.type);
            respond(id, { ok: true });
            break;
          }

          case "setRowHeight": {
            const p = payload as SetRowHeightPayload;
            wb?.setRowHeight(p.rowInfo, p.options as never, p.custom);
            respond(id, { ok: true });
            break;
          }

          case "setColumnWidth": {
            const p = payload as SetColumnWidthPayload;
            wb?.setColumnWidth(p.columnInfo, p.options as never, p.custom);
            respond(id, { ok: true });
            break;
          }

          case "getRowHeight": {
            const p = payload as GetRowHeightPayload;
            respond(id, wb?.getRowHeight(p.rows, p.options as never));
            break;
          }

          case "getColumnWidth": {
            const p = payload as GetColumnWidthPayload;
            respond(id, wb?.getColumnWidth(p.columns, p.options as never));
            break;
          }

          case "mergeCells": {
            const p = payload as MergeCellsPayload;
            wb?.mergeCells(p.ranges as never, p.type, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "cancelMerge": {
            const p = payload as CancelMergePayload;
            wb?.cancelMerge(p.ranges as never, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "addSheet": {
            const sheetId = (payload as { sheetId?: string } | undefined)?.sheetId;
            wb?.addSheet(sheetId);
            respond(id, { ok: true });
            break;
          }

          case "deleteSheet": {
            const sheetOpts = payload as SheetOptions | undefined;
            wb?.deleteSheet(sheetOpts as never);
            respond(id, { ok: true });
            break;
          }

          case "activateSheet": {
            const sheetOpts = payload as SheetOptions | undefined;
            wb?.activateSheet(sheetOpts as never);
            respond(id, { ok: true });
            break;
          }

          case "setSheetName": {
            const p = payload as SetSheetNamePayload;
            wb?.setSheetName(p.name, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "setSheetOrder": {
            const p = payload as SetSheetOrderPayload;
            wb?.setSheetOrder(p.orderList);
            respond(id, { ok: true });
            break;
          }

          case "scroll": {
            const p = payload as ScrollPayload;
            wb?.scroll(p);
            respond(id, { ok: true });
            break;
          }

          case "freeze": {
            const p = payload as FreezePayload;
            wb?.freeze(p.type, p.range, p.options as never);
            respond(id, { ok: true });
            break;
          }

          case "undo": {
            wb?.handleUndo();
            respond(id, { ok: true });
            break;
          }

          case "redo": {
            wb?.handleRedo();
            respond(id, { ok: true });
            break;
          }

          case "calculateFormula": {
            const p = (payload ?? {}) as CalculateFormulaPayload;
            wb?.calculateFormula(p.id, p.range as never);
            respond(id, { ok: true });
            break;
          }

          case "batchCallApis": {
            const p = payload as BatchCallApisPayload;
            wb?.batchCallApis(p.apiCalls as never);
            respond(id, { ok: true });
            break;
          }

          default:
            sendError(id, `Unknown message type: ${type}`);
        }
      } catch (err) {
        sendError(id, err instanceof Error ? err.message : String(err));
      }
    },
    [data, respond, sendError]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  /** Notify parent that the workbook is ready */
  useEffect(() => {
    postToParent({ source: "fortune-sheet-iframe", type: "ready" });
  }, [postToParent]);

  const workbookSettings = useMemo<Settings>(
    () => ({
      ...options,
      data,
    }),
    [options, data]
  );

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Workbook
        ref={workbookRef}
        {...workbookSettings}
        onChange={handleChange}
        onOp={handleOp}
      />
    </div>
  );
}

export default App;
