// Déclarations de modules sans types
declare module '@kuzu/kuzu-wasm' {
  export class Database {
    constructor(path?: string);
    close(): Promise<void>;
  }
  export class Connection {
    constructor(database: Database);
    execute(query: string): Promise<QueryResult>;
    close(): Promise<void>;
  }
  export interface QueryResult {
    getAll(): Promise<unknown[]>;
  }
}

declare module 'vis-timeline/types' {
  export interface DataItem {
    id: string | number;
    content: string;
    start: Date | string | number;
    end?: Date | string | number;
    type?: string;
    group?: string | number;
    className?: string;
    style?: string;
    title?: string;
    editable?: boolean;
    [key: string]: unknown;
  }

  export interface TimelineOptions {
    width?: string;
    height?: string;
    min?: Date;
    max?: Date;
    start?: Date;
    end?: Date;
    zoomMin?: number;
    zoomMax?: number;
    stack?: boolean;
    showCurrentTime?: boolean;
    locale?: string;
    orientation?: { axis?: string; item?: string };
    margin?: { item?: { horizontal?: number; vertical?: number } };
    selectable?: boolean;
    multiselect?: boolean;
    [key: string]: unknown;
  }

  export interface TimelineEventPropertiesResult {
    item?: string | number | null;
    group?: string | number | null;
    what?: string;
    pageX?: number;
    pageY?: number;
    x?: number;
    y?: number;
    time?: Date;
    snappedTime?: Date;
    [key: string]: unknown;
  }
}
