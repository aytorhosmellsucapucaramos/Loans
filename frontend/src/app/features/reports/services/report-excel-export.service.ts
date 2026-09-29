export type ExcelValue = string | number | Date | null;
export type ExcelValueKind = 'text' | 'number' | 'money' | 'date' | 'datetime';

export interface ExcelColumn {
  key: string;
  label: string;
  kind: ExcelValueKind;
  width?: number;
}

export interface ExcelReportDocument {
  title: string;
  sheetName: string;
  generatedAt: Date;
  appliedFilters: string;
  columns: ExcelColumn[];
  rows: ExcelValue[][];
}

const xmlEscape = (value: string): string => value
  .replace(/[\s\S]/g, (character) => {
    const code = character.charCodeAt(0);
    return code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d ? '' : character;
  })
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const columnName = (index: number): string => {
  let name = '';
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
};

const excelSerial = (date: Date): number => date.getTime() / 86_400_000 + 25_569;

const limaDate = (value: Date): Date => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(value);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value ?? 0);
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'), value.getUTCMilliseconds()));
};

const dateFromValue = (value: Date | string, useLimaTime: boolean): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : useLimaTime ? limaDate(value) : value;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const parsed = dateOnly
    ? new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])))
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : useLimaTime && !dateOnly ? limaDate(parsed) : parsed;
};

const cellXml = (reference: string, value: ExcelValue, kind: ExcelValueKind, row: number): string => {
  const style = row === 1 ? 4 : row === 5 ? 5 : kind === 'money' ? 1 : kind === 'date' ? 2 : kind === 'datetime' ? 3 : 0;
  const styleAttribute = style ? ` s="${style}"` : '';
  if (value === null || value === undefined || value === '') return `<c r="${reference}"${styleAttribute}/>`;
  if (kind === 'money' || kind === 'number') {
    const number = Number(value);
    return Number.isFinite(number) ? `<c r="${reference}"${styleAttribute}><v>${number}</v></c>` : `<c r="${reference}" t="inlineStr"${styleAttribute}><is><t>${xmlEscape(String(value))}</t></is></c>`;
  }
  if (kind === 'date' || kind === 'datetime') {
    const date = dateFromValue(value as Date | string, kind === 'datetime');
    if (date) return `<c r="${reference}" s="${kind === 'date' ? 2 : 3}"><v>${excelSerial(date)}</v></c>`;
  }
  return `<c r="${reference}" t="inlineStr"${styleAttribute}><is><t xml:space="preserve">${xmlEscape(String(value))}</t></is></c>`;
};

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3"><numFmt numFmtId="164" formatCode="&quot;S/&quot; #,##0.00;[Red]-&quot;S/&quot; #,##0.00"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/><numFmt numFmtId="166" formatCode="dd/mm/yyyy hh:mm"/></numFmts>
  <fonts count="3"><font><sz val="10"/><name val="Aptos"/></font><font><b/><sz val="10"/><name val="Aptos"/></font><font><b/><sz val="16"/><name val="Aptos Display"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F0FC"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFD8DFEA"/></bottom><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

@Injectable({ providedIn: 'root' })
export class ReportExcelExportService {
  async build(document: ExcelReportDocument): Promise<Uint8Array> {
    if (!document.columns.length) throw new Error('El reporte no contiene columnas exportables.');
    if (document.rows.length + 5 > 1_048_576) throw new RangeError('El reporte supera el máximo de filas de una hoja de Excel.');
    const { strToU8, zipSync } = await import('fflate');
    const lastColumn = columnName(document.columns.length - 1);
    const lastRow = Math.max(5, document.rows.length + 5);
    const worksheetRows: string[] = [];
    const metadata: { row: number; values: ExcelValue[]; kinds: ExcelValueKind[] }[] = [
      { row: 1, values: [document.title], kinds: ['text'] },
      { row: 2, values: ['Generado el', document.generatedAt], kinds: ['text', 'datetime'] },
      { row: 3, values: ['Filtros aplicados', document.appliedFilters || 'Sin filtros'], kinds: ['text', 'text'] },
      { row: 5, values: document.columns.map((column) => column.label), kinds: document.columns.map(() => 'text') },
      ...document.rows.map((values, index) => ({ row: index + 6, values, kinds: document.columns.map((column) => column.kind) })),
    ];
    for (const entry of metadata) {
      const cells = entry.values.map((value, index) => cellXml(`${columnName(index)}${entry.row}`, value, entry.kinds[index] ?? 'text', entry.row)).join('');
      worksheetRows.push(`<row r="${entry.row}">${cells}</row>`);
    }
    const widths = document.columns.map((column, index) => `<col min="${index + 1}" max="${index + 1}" width="${column.width ?? 18}" customWidth="1"/>`).join('');
    const sheetName = document.sheetName.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 31) || 'Reporte';
    const mergeXml = document.columns.length > 1
      ? `<mergeCells count="2"><mergeCell ref="A1:${lastColumn}1"/><mergeCell ref="B3:${lastColumn}3"/></mergeCells>`
      : '';
    const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths}</cols><sheetData>${worksheetRows.join('')}</sheetData><autoFilter ref="A5:${lastColumn}${lastRow}"/>${mergeXml}<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`;
    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
    const files: Record<string, Uint8Array> = {
      '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
      '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
      'xl/workbook.xml': strToU8(workbookXml),
      'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
      'xl/styles.xml': strToU8(stylesXml),
      'xl/worksheets/sheet1.xml': strToU8(worksheetXml),
    };
    return zipSync(files, { level: 6 });
  }
}
import { Injectable } from '@angular/core';

