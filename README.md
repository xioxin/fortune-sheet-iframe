# fortune-sheet-iframe

A React application that wraps [FortuneSheet](https://github.com/ruilisi/fortune-sheet) and exposes it as an embeddable `<iframe>`. Communicate with the spreadsheet from any frontend framework (Angular, Vue, plain HTML, etc.) using the `postMessage` API.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Embedding via iframe](#embedding-via-iframe)
- [postMessage API](#postmessage-api)
  - [Message format](#message-format)
  - [Incoming messages (parent → iframe)](#incoming-messages-parent--iframe)
  - [Outgoing messages (iframe → parent)](#outgoing-messages-iframe--parent)
- [Usage examples](#usage-examples)
  - [Angular](#angular)
  - [Vue](#vue)
  - [Plain HTML / JavaScript](#plain-html--javascript)
- [Building for production](#building-for-production)
- [License](#license)

---

## 简体中文文档

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [通过-iframe-嵌入](#通过-iframe-嵌入)
- [postMessage-api-说明](#postmessage-api-说明)
  - [消息格式](#消息格式)
  - [传入消息父页面iframe](#传入消息父页面iframe)
  - [传出消息iframe父页面](#传出消息iframe父页面)
- [使用示例](#使用示例)
  - [angular-示例](#angular-示例)
  - [vue-示例](#vue-示例)
  - [原生-html--javascript-示例](#原生-html--javascript-示例)
- [生产构建](#生产构建)

---

## Features

- Full-featured spreadsheet powered by **FortuneSheet** (Excel-like UX).
- Zero extra UI — no save button, no toolbar extras. Saving is triggered entirely by the host page.
- **postMessage-based API** for initialization, reading/writing data, cell operations, sheet management, and more.
- Request/response correlation via optional `id` field.
- Event notifications for data changes and collaborative operations (`onOp`).
- Works in **Angular**, **Vue**, **React**, or any plain HTML page.
- Configurable: language, toolbar items, context menus, row/column defaults, zoom, freeze, and all other FortuneSheet settings.

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
npm install
```

### Development server

```bash
npm run dev
# Spreadsheet available at http://localhost:5173
```

---

## Embedding via iframe

Place the built (or dev-server) URL in an `<iframe>` in your host page:

```html
<iframe
  id="spreadsheet"
  src="http://localhost:5173"
  style="width:100%;height:600px;border:none;"
></iframe>
```

> **Tip for production**: Run `npm run build` and serve the `dist/` folder with any static file server (Nginx, Caddy, `serve`, etc.).

---

## postMessage API

### Message format

#### Incoming (parent → iframe)

```ts
{
  type: string;       // message type (see table below)
  id?: string;        // optional request ID for correlating responses
  payload?: unknown;  // message-specific data
}
```

#### Outgoing (iframe → parent)

```ts
{
  source: "fortune-sheet-iframe"; // always present — use this to filter messages
  type: "ready" | "response" | "onChange" | "onOp" | "error";
  id?: string;        // echoed from the incoming message id
  payload?: unknown;  // response data or event data
}
```

Always filter incoming `message` events by `event.data.source === "fortune-sheet-iframe"` to avoid processing unrelated messages.

---

### Incoming messages (parent → iframe)

#### Workbook lifecycle

| `type` | `payload` | Description |
|--------|-----------|-------------|
| `init` | `{ data?: Sheet[], options?: WorkbookOptions }` | Initialize the workbook with data and options. Sends `response`. |
| `updateData` | `Sheet[]` | Replace all sheet data. Sends `response`. |
| `setOptions` | `WorkbookOptions` | Merge new display/behavior options. Sends `response`. |

**`WorkbookOptions`** (all optional):

```ts
{
  column?: number;             // default column count
  row?: number;                // default row count
  allowEdit?: boolean;         // enable/disable editing (default: true)
  showToolbar?: boolean;       // show/hide toolbar
  showFormulaBar?: boolean;    // show/hide formula bar
  showSheetTabs?: boolean;     // show/hide sheet tab bar
  lang?: string;               // locale: "zh", "en", "es", "ru", "hi", "zh_tw"
  devicePixelRatio?: number;   // canvas DPI
  rowHeaderWidth?: number;     // width of the row header
  columnHeaderHeight?: number; // height of the column header
  defaultColWidth?: number;    // default column width
  defaultRowHeight?: number;   // default row height
  defaultFontSize?: number;    // default font size
  toolbarItems?: string[];     // which toolbar buttons to show
  cellContextMenu?: string[];  // context menu items for cells
  currency?: string;           // currency symbol
}
```

#### Data retrieval

| `type` | `payload` | Response `payload` |
|--------|-----------|---------------------|
| `getData` | — | `Sheet[]` — all sheets |
| `getAllSheets` | — | `Sheet[]` — all sheets |
| `getSheet` | `{ id?: string }` | Current (or specified) sheet object |

#### Cell operations

| `type` | `payload` | Description |
|--------|-----------|-------------|
| `setCellValue` | `{ row, column, value, options? }` | Set a cell value |
| `getCellValue` | `{ row, column, options? }` | Get a cell value |
| `clearCell` | `{ row, column, options? }` | Clear a cell |
| `setCellFormat` | `{ row, column, attr, value, options? }` | Set a cell format attribute |
| `setCellValuesByRange` | `{ data: any[][], range: { row: [start, end], column: [start, end] }, options? }` | Set values for a range |
| `setCellFormatByRange` | `{ attr, value, range, options? }` | Set format for a range |

#### Selection

| `type` | `payload` | Response `payload` |
|--------|-----------|---------------------|
| `setSelection` | `{ range: [{row:[s,e], column:[s,e]}], options? }` | Set the active selection |
| `getSelection` | — | `[{ row: number[], column: number[] }]` |
| `getSelectionCoordinates` | — | `string[]` e.g. `["A1:B2"]` |
| `getCellsByRange` | `{ range: { row:[s,e], column:[s,e] }, options? }` | `(Cell\|null)[][]` |

#### Rows and columns

| `type` | `payload` | Description |
|--------|-----------|-------------|
| `insertRowOrColumn` | `{ type: "row"\|"column", index, count, direction?, options? }` | Insert rows/columns |
| `deleteRowOrColumn` | `{ type: "row"\|"column", start, end, options? }` | Delete rows/columns |
| `hideRowOrColumn` | `{ rowOrColInfo: string[], type: "row"\|"column" }` | Hide rows/columns |
| `showRowOrColumn` | `{ rowOrColInfo: string[], type: "row"\|"column" }` | Show hidden rows/columns |
| `setRowHeight` | `{ rowInfo: Record<number,number>, options?, custom? }` | Set row heights |
| `setColumnWidth` | `{ columnInfo: Record<number,number>, options?, custom? }` | Set column widths |
| `getRowHeight` | `{ rows: number[], options? }` | Get row heights |
| `getColumnWidth` | `{ columns: number[], options? }` | Get column widths |

#### Merge

| `type` | `payload` | Description |
|--------|-----------|-------------|
| `mergeCells` | `{ ranges: [{row:[s,e], column:[s,e]}], type: string, options? }` | Merge cells |
| `cancelMerge` | `{ ranges: [{row:[s,e], column:[s,e]}], options? }` | Unmerge cells |

#### Sheet management

| `type` | `payload` | Description |
|--------|-----------|-------------|
| `addSheet` | `{ sheetId?: string }` | Add a new sheet |
| `deleteSheet` | `{ id?: string }` | Delete a sheet |
| `activateSheet` | `{ id?: string }` | Switch to a sheet |
| `setSheetName` | `{ name: string, options?: { id? } }` | Rename a sheet |
| `setSheetOrder` | `{ orderList: Record<string, number> }` | Reorder sheets |

#### View

| `type` | `payload` | Description |
|--------|-----------|-------------|
| `scroll` | `{ scrollLeft?, scrollTop?, targetRow?, targetColumn? }` | Scroll the viewport |
| `freeze` | `{ type: "row"\|"column"\|"both", range: { row, column }, options? }` | Freeze panes |

#### History

| `type` | Description |
|--------|-------------|
| `undo` | Undo the last action |
| `redo` | Redo the last undone action |

#### Advanced

| `type` | `payload` | Description |
|--------|-----------|-------------|
| `applyOp` | `{ ops: Op[] }` | Apply a list of collaborative operations |
| `calculateFormula` | `{ id?, range? }` | Force formula recalculation |
| `batchCallApis` | `{ apiCalls: [{name, args}] }` | Call multiple APIs in one message |

---

### Outgoing messages (iframe → parent)

| `type` | `payload` | Description |
|--------|-----------|-------------|
| `ready` | — | Emitted once when the workbook is mounted and ready |
| `response` | Varies | Reply to any request that sends back data; `id` matches the request |
| `onChange` | `Sheet[]` | Emitted after every user edit with the full updated sheet list |
| `onOp` | `Op[]` | Emitted with the raw operation list (useful for collaborative sync) |
| `error` | `{ message: string }` | Emitted when a message handler throws an error |

---

## Usage examples

### Angular

```ts
// spreadsheet.component.ts
import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';

interface SpreadsheetMessage {
  source: 'fortune-sheet-iframe';
  type: string;
  id?: string;
  payload?: unknown;
}

@Component({
  selector: 'app-spreadsheet',
  template: `
    <iframe #sheet
      src="http://localhost:5173"
      style="width:100%;height:600px;border:none;">
    </iframe>
    <button (click)="save()">Save</button>
  `
})
export class SpreadsheetComponent implements OnInit, OnDestroy {
  @ViewChild('sheet', { static: true }) iframeEl!: ElementRef<HTMLIFrameElement>;

  private pendingRequests = new Map<string, (payload: unknown) => void>();
  private messageListener!: (e: MessageEvent) => void;

  constructor(private zone: NgZone) {}

  ngOnInit(): void {
    this.messageListener = (event: MessageEvent) => {
      const msg = event.data as SpreadsheetMessage;
      if (msg?.source !== 'fortune-sheet-iframe') return;

      this.zone.run(() => {
        if (msg.type === 'ready') {
          this.initSpreadsheet();
        } else if (msg.type === 'response' && msg.id) {
          const resolve = this.pendingRequests.get(msg.id);
          if (resolve) {
            resolve(msg.payload);
            this.pendingRequests.delete(msg.id);
          }
        } else if (msg.type === 'onChange') {
          console.log('Data changed:', msg.payload);
        }
      });
    };
    window.addEventListener('message', this.messageListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.messageListener);
  }

  private post(type: string, payload?: unknown): void {
    this.iframeEl.nativeElement.contentWindow?.postMessage({ type, payload }, '*');
  }

  /** Returns a Promise that resolves with the response payload */
  private request<T>(type: string, payload?: unknown): Promise<T> {
    const id = crypto.randomUUID();
    return new Promise((resolve) => {
      this.pendingRequests.set(id, (p) => resolve(p as T));
      this.iframeEl.nativeElement.contentWindow?.postMessage({ type, id, payload }, '*');
    });
  }

  private initSpreadsheet(): void {
    this.post('init', {
      options: { lang: 'zh', showToolbar: true, showSheetTabs: true },
      data: [{ name: 'Sheet1', celldata: [] }]
    });
  }

  async save(): Promise<void> {
    const sheets = await this.request<unknown[]>('getData');
    console.log('Spreadsheet data:', sheets);
    // Send to your backend API here
  }
}
```

---

### Vue

```vue
<!-- Spreadsheet.vue -->
<template>
  <div>
    <iframe ref="sheet"
      src="http://localhost:5173"
      style="width:100%;height:600px;border:none;"
    />
    <button @click="save">Save</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const sheet = ref<HTMLIFrameElement>()
const pendingRequests = new Map<string, (p: unknown) => void>()

function post(type: string, payload?: unknown) {
  sheet.value?.contentWindow?.postMessage({ type, payload }, '*')
}

function request<T>(type: string, payload?: unknown): Promise<T> {
  const id = crypto.randomUUID()
  return new Promise((resolve) => {
    pendingRequests.set(id, (p) => resolve(p as T))
    sheet.value?.contentWindow?.postMessage({ type, id, payload }, '*')
  })
}

function handleMessage(event: MessageEvent) {
  const msg = event.data
  if (msg?.source !== 'fortune-sheet-iframe') return

  if (msg.type === 'ready') {
    post('init', {
      options: { lang: 'en', showToolbar: true },
      data: [{ name: 'Sheet1', celldata: [] }]
    })
  } else if (msg.type === 'response' && msg.id) {
    const resolve = pendingRequests.get(msg.id)
    if (resolve) {
      resolve(msg.payload)
      pendingRequests.delete(msg.id)
    }
  } else if (msg.type === 'onChange') {
    console.log('Data changed:', msg.payload)
  }
}

async function save() {
  const sheets = await request('getData')
  console.log('Spreadsheet data:', sheets)
  // Send to your backend API here
}

onMounted(() => window.addEventListener('message', handleMessage))
onUnmounted(() => window.removeEventListener('message', handleMessage))
</script>
```

---

### Plain HTML / JavaScript

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My App with Spreadsheet</title>
</head>
<body>
  <iframe id="sheet"
    src="http://localhost:5173"
    style="width:100%;height:600px;border:none;">
  </iframe>
  <button onclick="save()">Save</button>

  <script>
    const iframe = document.getElementById('sheet');
    const pending = new Map();

    function post(type, payload) {
      iframe.contentWindow.postMessage({ type, payload }, '*');
    }

    function request(type, payload) {
      const id = crypto.randomUUID();
      return new Promise((resolve) => {
        pending.set(id, resolve);
        iframe.contentWindow.postMessage({ type, id, payload }, '*');
      });
    }

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg?.source !== 'fortune-sheet-iframe') return;

      if (msg.type === 'ready') {
        post('init', {
          options: { lang: 'zh', showToolbar: true, showSheetTabs: true },
          data: [{ name: 'Sheet1', celldata: [] }]
        });
      } else if (msg.type === 'response' && msg.id) {
        const resolve = pending.get(msg.id);
        if (resolve) {
          resolve(msg.payload);
          pending.delete(msg.id);
        }
      } else if (msg.type === 'onChange') {
        console.log('Sheet data changed');
      } else if (msg.type === 'onOp') {
        console.log('Op:', msg.payload);
      }
    });

    async function save() {
      const sheets = await request('getData');
      console.log('Data:', JSON.stringify(sheets));
      // POST to your backend here
    }
  </script>
</body>
</html>
```

---

## Building for production

```bash
npm run build
# output in dist/
```

### Origin security

By default the iframe replies to the parent using `document.referrer` as the target origin (falling back to `*` when the referrer is unavailable, e.g. same-origin dev). For stricter control, set the `VITE_PARENT_ORIGIN` environment variable at build time:

```bash
VITE_PARENT_ORIGIN=https://myapp.example.com npm run build
```

Or create a `.env.production` file:

```
VITE_PARENT_ORIGIN=https://myapp.example.com
```

This restricts all `postMessage` replies to the specified origin only.

Serve the `dist/` folder with any static file server. For example with `serve`:

```bash
npx serve dist
```

Or with Nginx:

```nginx
server {
  listen 80;
  root /path/to/fortune-sheet-iframe/dist;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Configure the iframe `src` in your host application to point to the production URL.

---

## License

MIT

---

---

# 简体中文文档

## 功能特性

- 基于 **FortuneSheet** 的完整表格功能（类 Excel 交互）。
- 零额外 UI — 无保存按钮，所有保存操作由宿主页面主动触发。
- 基于 **postMessage** 的完整 API，支持初始化、读写数据、单元格操作、工作表管理等。
- 通过可选 `id` 字段实现请求/响应关联。
- 支持 **Angular、Vue、React 或原生 HTML** 页面嵌入。
- 可配置：语言、工具栏项目、右键菜单、行列默认值、冻结窗格等 FortuneSheet 所有设置。

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发服务器

```bash
npm run dev
# 表格地址：http://localhost:5173
```

---

## 通过 iframe 嵌入

在宿主页面中放置一个 `<iframe>`，将 `src` 指向本项目地址：

```html
<iframe
  id="spreadsheet"
  src="http://localhost:5173"
  style="width:100%;height:600px;border:none;"
></iframe>
```

> **生产环境提示**：运行 `npm run build` 后，用任意静态文件服务器（Nginx、Caddy、`serve` 等）托管 `dist/` 目录即可。

---

## postMessage API 说明

### 消息格式

#### 传入消息（父页面 → iframe）

```ts
{
  type: string;       // 消息类型（见下表）
  id?: string;        // 可选请求 ID，用于关联响应
  payload?: unknown;  // 消息携带的数据，因类型而异
}
```

#### 传出消息（iframe → 父页面）

```ts
{
  source: "fortune-sheet-iframe"; // 始终存在，用于过滤消息
  type: "ready" | "response" | "onChange" | "onOp" | "error";
  id?: string;        // 回显传入消息中的 id
  payload?: unknown;  // 响应数据或事件数据
}
```

**重要**：始终通过 `event.data.source === "fortune-sheet-iframe"` 过滤消息，避免处理无关消息。

---

### 传入消息（父页面→iframe）

#### 工作簿生命周期

| `type` | `payload` | 说明 |
|--------|-----------|------|
| `init` | `{ data?: Sheet[], options?: WorkbookOptions }` | 初始化工作簿数据和选项，返回 `response` |
| `updateData` | `Sheet[]` | 替换全部工作表数据，返回 `response` |
| `setOptions` | `WorkbookOptions` | 合并新的显示/行为选项，返回 `response` |

**`WorkbookOptions`**（均为可选）：

```ts
{
  allowEdit?: boolean;         // 是否允许编辑（默认 true）
  showToolbar?: boolean;       // 显示/隐藏工具栏
  showFormulaBar?: boolean;    // 显示/隐藏公式栏
  showSheetTabs?: boolean;     // 显示/隐藏工作表标签栏
  lang?: string;               // 语言：'zh'、'en'、'es'、'ru'、'hi'、'zh_tw'
  defaultColWidth?: number;    // 默认列宽
  defaultRowHeight?: number;   // 默认行高
  defaultFontSize?: number;    // 默认字号
  toolbarItems?: string[];     // 工具栏按钮列表
  currency?: string;           // 货币符号
}
```

#### 数据读取

| `type` | `payload` | 响应 `payload` |
|--------|-----------|----------------|
| `getData` | — | `Sheet[]` — 所有工作表数据 |
| `getAllSheets` | — | `Sheet[]` — 所有工作表数据 |
| `getSheet` | `{ id?: string }` | 当前（或指定）工作表对象 |

#### 单元格操作

| `type` | `payload` | 说明 |
|--------|-----------|------|
| `setCellValue` | `{ row, column, value, options? }` | 设置单元格值 |
| `getCellValue` | `{ row, column, options? }` | 获取单元格值 |
| `clearCell` | `{ row, column, options? }` | 清空单元格 |
| `setCellFormat` | `{ row, column, attr, value, options? }` | 设置单元格格式属性 |
| `setCellValuesByRange` | `{ data: any[][], range: { row:[s,e], column:[s,e] }, options? }` | 批量设置范围内单元格值 |
| `setCellFormatByRange` | `{ attr, value, range, options? }` | 批量设置范围内单元格格式 |

#### 选区

| `type` | `payload` | 响应 `payload` |
|--------|-----------|----------------|
| `setSelection` | `{ range: [{row:[s,e], column:[s,e]}], options? }` | 设置选区 |
| `getSelection` | — | `[{ row: number[], column: number[] }]` |
| `getSelectionCoordinates` | — | `string[]` 如 `["A1:B2"]` |
| `getCellsByRange` | `{ range: { row:[s,e], column:[s,e] }, options? }` | `(Cell\|null)[][]` |

#### 行列操作

| `type` | `payload` | 说明 |
|--------|-----------|------|
| `insertRowOrColumn` | `{ type: "row"\|"column", index, count, direction?, options? }` | 插入行/列 |
| `deleteRowOrColumn` | `{ type: "row"\|"column", start, end, options? }` | 删除行/列 |
| `hideRowOrColumn` | `{ rowOrColInfo: string[], type: "row"\|"column" }` | 隐藏行/列 |
| `showRowOrColumn` | `{ rowOrColInfo: string[], type: "row"\|"column" }` | 显示隐藏的行/列 |
| `setRowHeight` | `{ rowInfo: Record<number,number>, options?, custom? }` | 设置行高 |
| `setColumnWidth` | `{ columnInfo: Record<number,number>, options?, custom? }` | 设置列宽 |
| `getRowHeight` | `{ rows: number[], options? }` | 获取行高 |
| `getColumnWidth` | `{ columns: number[], options? }` | 获取列宽 |

#### 合并单元格

| `type` | `payload` | 说明 |
|--------|-----------|------|
| `mergeCells` | `{ ranges: [{row:[s,e], column:[s,e]}], type: string, options? }` | 合并单元格 |
| `cancelMerge` | `{ ranges: [{row:[s,e], column:[s,e]}], options? }` | 取消合并 |

#### 工作表管理

| `type` | `payload` | 说明 |
|--------|-----------|------|
| `addSheet` | `{ sheetId?: string }` | 新增工作表 |
| `deleteSheet` | `{ id?: string }` | 删除工作表 |
| `activateSheet` | `{ id?: string }` | 切换到指定工作表 |
| `setSheetName` | `{ name: string, options?: { id? } }` | 重命名工作表 |
| `setSheetOrder` | `{ orderList: Record<string, number> }` | 调整工作表顺序 |

#### 视图

| `type` | `payload` | 说明 |
|--------|-----------|------|
| `scroll` | `{ scrollLeft?, scrollTop?, targetRow?, targetColumn? }` | 滚动视口 |
| `freeze` | `{ type: "row"\|"column"\|"both", range: { row, column }, options? }` | 冻结窗格 |

#### 历史记录

| `type` | 说明 |
|--------|------|
| `undo` | 撤销上一步操作 |
| `redo` | 重做上一步撤销 |

#### 高级功能

| `type` | `payload` | 说明 |
|--------|-----------|------|
| `applyOp` | `{ ops: Op[] }` | 应用协同编辑操作 |
| `calculateFormula` | `{ id?, range? }` | 强制重新计算公式 |
| `batchCallApis` | `{ apiCalls: [{name, args}] }` | 批量调用多个 API |

---

### 传出消息（iframe→父页面）

| `type` | `payload` | 说明 |
|--------|-----------|------|
| `ready` | — | 工作簿挂载完成后发送一次 |
| `response` | 因请求类型而异 | 对请求的响应，`id` 与请求一致 |
| `onChange` | `Sheet[]` | 每次用户编辑后发送完整的工作表数据 |
| `onOp` | `Op[]` | 发送原始操作列表（适用于协同同步） |
| `error` | `{ message: string }` | 消息处理出错时发送 |

---

## 使用示例

### Angular 示例

```ts
// spreadsheet.component.ts
import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';

@Component({
  selector: 'app-spreadsheet',
  template: `
    <iframe #sheet
      src="http://localhost:5173"
      style="width:100%;height:600px;border:none;">
    </iframe>
    <button (click)="save()">保存</button>
  `
})
export class SpreadsheetComponent implements OnInit, OnDestroy {
  @ViewChild('sheet', { static: true }) iframeEl!: ElementRef<HTMLIFrameElement>;

  private pendingRequests = new Map<string, (payload: unknown) => void>();
  private messageListener!: (e: MessageEvent) => void;

  constructor(private zone: NgZone) {}

  ngOnInit(): void {
    this.messageListener = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.source !== 'fortune-sheet-iframe') return;

      this.zone.run(() => {
        if (msg.type === 'ready') {
          this.initSpreadsheet();
        } else if (msg.type === 'response' && msg.id) {
          const resolve = this.pendingRequests.get(msg.id);
          if (resolve) {
            resolve(msg.payload);
            this.pendingRequests.delete(msg.id);
          }
        } else if (msg.type === 'onChange') {
          // 实时数据变化
        }
      });
    };
    window.addEventListener('message', this.messageListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.messageListener);
  }

  private post(type: string, payload?: unknown): void {
    this.iframeEl.nativeElement.contentWindow?.postMessage({ type, payload }, '*');
  }

  private request<T>(type: string, payload?: unknown): Promise<T> {
    const id = crypto.randomUUID();
    return new Promise((resolve) => {
      this.pendingRequests.set(id, (p) => resolve(p as T));
      this.iframeEl.nativeElement.contentWindow?.postMessage({ type, id, payload }, '*');
    });
  }

  private initSpreadsheet(): void {
    this.post('init', {
      options: { lang: 'zh', showToolbar: true, showSheetTabs: true },
      data: [{ name: 'Sheet1', celldata: [] }]
    });
  }

  async save(): Promise<void> {
    const sheets = await this.request<unknown[]>('getData');
    // 将数据发送到后端
    console.log('保存数据:', sheets);
  }
}
```

---

### Vue 示例

```vue
<template>
  <div>
    <iframe ref="sheet"
      src="http://localhost:5173"
      style="width:100%;height:600px;border:none;"
    />
    <button @click="save">保存</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const sheet = ref<HTMLIFrameElement>()
const pending = new Map<string, (p: unknown) => void>()

function post(type: string, payload?: unknown) {
  sheet.value?.contentWindow?.postMessage({ type, payload }, '*')
}

function request<T>(type: string, payload?: unknown): Promise<T> {
  const id = crypto.randomUUID()
  return new Promise((resolve) => {
    pending.set(id, (p) => resolve(p as T))
    sheet.value?.contentWindow?.postMessage({ type, id, payload }, '*')
  })
}

function handleMessage(event: MessageEvent) {
  const msg = event.data
  if (msg?.source !== 'fortune-sheet-iframe') return
  if (msg.type === 'ready') {
    post('init', { options: { lang: 'zh' }, data: [{ name: 'Sheet1', celldata: [] }] })
  } else if (msg.type === 'response' && msg.id) {
    const resolve = pending.get(msg.id)
    if (resolve) { resolve(msg.payload); pending.delete(msg.id) }
  }
}

async function save() {
  const sheets = await request('getData')
  console.log('保存数据:', sheets)
}

onMounted(() => window.addEventListener('message', handleMessage))
onUnmounted(() => window.removeEventListener('message', handleMessage))
</script>
```

---

### 原生 HTML / JavaScript 示例

```html
<!DOCTYPE html>
<html lang="zh">
<body>
  <iframe id="sheet" src="http://localhost:5173"
    style="width:100%;height:600px;border:none;"></iframe>
  <button onclick="save()">保存</button>

  <script>
    const iframe = document.getElementById('sheet');
    const pending = new Map();

    function post(type, payload) {
      iframe.contentWindow.postMessage({ type, payload }, '*');
    }

    function request(type, payload) {
      const id = crypto.randomUUID();
      return new Promise((resolve) => {
        pending.set(id, resolve);
        iframe.contentWindow.postMessage({ type, id, payload }, '*');
      });
    }

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg?.source !== 'fortune-sheet-iframe') return;
      if (msg.type === 'ready') {
        post('init', {
          options: { lang: 'zh', showToolbar: true },
          data: [{ name: 'Sheet1', celldata: [] }]
        });
      } else if (msg.type === 'response' && msg.id) {
        const r = pending.get(msg.id);
        if (r) { r(msg.payload); pending.delete(msg.id); }
      }
    });

    async function save() {
      const sheets = await request('getData');
      // 发送到后端
      console.log(JSON.stringify(sheets));
    }
  </script>
</body>
</html>
```

---

## 生产构建

```bash
npm run build
# 产物输出到 dist/
```

### 消息来源安全

默认情况下，iframe 使用 `document.referrer` 作为 `postMessage` 的目标来源（开发模式下回退到 `*`）。如需更严格的控制，可在构建时设置 `VITE_PARENT_ORIGIN` 环境变量：

```bash
VITE_PARENT_ORIGIN=https://myapp.example.com npm run build
```

或者创建 `.env.production` 文件：

```
VITE_PARENT_ORIGIN=https://myapp.example.com
```

这将把所有 `postMessage` 回复限制为仅发送到指定来源。

使用任意静态文件服务器托管 `dist/` 目录，例如：

```bash
npx serve dist
```
