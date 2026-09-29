import { strFromU8, unzipSync } from 'fflate';

import { ReportExcelExportService } from './report-excel-export.service';

describe('ReportExcelExportService', () => {
  it('creates a valid XLSX package with typed PEN and date cells plus Spanish metadata', async () => {
    const service = new ReportExcelExportService();
    const bytes = await service.build({
      title: 'Cartera de préstamos',
      sheetName: 'Cartera',
      generatedAt: new Date('2026-09-28T17:00:00.000Z'),
      appliedFilters: 'Desde: 01/09/2026 · Estado: Pagado',
      columns: [
        { key: 'customerName', label: 'Cliente', kind: 'text' },
        { key: 'amount', label: 'Capital (S/)', kind: 'money' },
        { key: 'date', label: 'Fecha de desembolso', kind: 'date' },
      ],
      rows: [['=HYPERLINK("https://example.com")', 1234.5, '2026-09-15']],
    });
    const files = unzipSync(bytes);
    const workbook = strFromU8(files['xl/workbook.xml']!);
    const styles = strFromU8(files['xl/styles.xml']!);
    const sheet = strFromU8(files['xl/worksheets/sheet1.xml']!);

    expect(files['[Content_Types].xml']).toBeDefined();
    expect(files['_rels/.rels']).toBeDefined();
    expect(workbook).toContain('name="Cartera"');
    expect(sheet).toContain('Cartera de préstamos');
    expect(sheet).toContain('Generado el');
    expect(sheet).toContain('Desde: 01/09/2026 · Estado: Pagado');
    expect(sheet).toContain('Capital (S/)');
    expect(sheet).toContain('<c r="B6" s="1"><v>1234.5</v></c>');
    expect(sheet).toContain('<c r="C6" s="2"><v>46280</v></c>');
    expect(styles).toContain('formatCode="dd/mm/yyyy"');
    expect(styles).toContain('&quot;S/&quot; #,##0.00');
  });

  it('stores formula-like record text as literal inline text, never as a formula', async () => {
    const bytes = await new ReportExcelExportService().build({
      title: 'Cobranza', sheetName: 'Cobranza', generatedAt: new Date('2026-09-28T12:00:00Z'),
      appliedFilters: 'Sin filtros', columns: [{ key: 'reference', label: 'Referencia', kind: 'text' }],
      rows: [['=1+1 & <texto>']],
    });
    const sheet = strFromU8(unzipSync(bytes)['xl/worksheets/sheet1.xml']!);

    expect(sheet).toContain('t="inlineStr"');
    expect(sheet).toContain('=1+1 &amp; &lt;texto&gt;');
    expect(sheet).not.toMatch(/<f(?:\s|>)/);
  });
});
