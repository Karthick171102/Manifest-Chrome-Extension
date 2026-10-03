export interface ElementStyles {
  color: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
}

export interface EditedElement {
  selector: string;
  tagName: string;
  id: string | null;
  classes: string[];
  original: {
    text: string;
    styles: ElementStyles;
  };
  current: {
    text: string;
    styles: ElementStyles;
  };
}

export interface MessageFromContent {
  type: 'element-selected' | 'element-clicked' | 'edit-text' | 'edit-color' | 'edit-font' | 'generate-prompt' | 'pointer-status';
  elementId?: string;
  selector?: string;
  text?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  element?: EditedElement;
  active?: boolean;
}

export interface MessageToContent {
  type: 'pointer-toggle' | 'highlight' | 'reset-selection' | 'apply-edit' | 'edit-text' | 'edit-color' | 'edit-font' | 'get-status';
  selector?: string;
  active?: boolean;
  styles?: Partial<ElementStyles>;
  text?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
}

export interface DiffChange {
  property: 'text' | 'color' | 'fontFamily' | 'fontSize' | 'fontWeight' | 'lineHeight';
  from: string;
  to: string;
}

export interface GeneratedPrompt {
  pageUrl: string;
  element: string;
  selector: string;
  changes: DiffChange[];
  textPrompt: string;
  jsonPrompt: string;
}