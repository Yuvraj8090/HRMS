// src/utils/excelParser.js
import xlsx from 'xlsx';

export class ExcelParser {
  static parse(buffer) {
    const wb  = xlsx.read(buffer, { type: 'buffer' });
    const sh  = wb.Sheets[wb.SheetNames[0]];
    const raw = xlsx.utils.sheet_to_json(sh, { header: 1, defval: '' });
    // Detect HTML-in-XLS format
    if (raw.length === 1 && Array.isArray(raw[0]) && raw[0].length === 1 && String(raw[0][0]).includes('<table')) {
      return ExcelParser._parseHtml(String(raw[0][0]));
    }
    return ExcelParser._parseRows(raw);
  }

  static _strip(s)   { return String(s).replace(/<[^>]+>/g, '').trim(); }
  static _num(v)     { const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n; }
  static _parseDate(s) {
    const m = s.match(/(\d{2})-(\d{2})-(\d{4})/);
    return m ? new Date(`${m[3]}-${m[2]}-${m[1]}`) : null;
  }
  static _parseOT(v) {
    const [h = '0', m = '0'] = String(v).split(':');
    return { otHours: parseInt(h) || 0, otMinutes: parseInt(m) || 0 };
  }

  static _parseHtml(html) {
    const meta = { organisationName: '', reportTitle: '', fromDate: null, toDate: null, month: null, year: null };
    const rows = [];
    const trs  = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    let hdr = false;

    for (const tr of trs) {
      const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => ExcelParser._strip(m[1]));
      if (!tds.length) continue;
      const j = tds.join(' ').toLowerCase();

      if (!meta.organisationName && tr[0].includes('center') && tds.length === 1 && tds[0].length > 5)
        { meta.organisationName = tds[0]; continue; }

      if (j.includes('employee wise attendance')) {
        meta.reportTitle = tds[0];
        const dm = [...meta.reportTitle.matchAll(/(\d{2}-\d{2}-\d{4})/g)];
        if (dm.length >= 2) {
          meta.fromDate = ExcelParser._parseDate(dm[0][1]);
          meta.toDate   = ExcelParser._parseDate(dm[1][1]);
          if (meta.fromDate) { meta.month = meta.fromDate.getMonth() + 1; meta.year = meta.fromDate.getFullYear(); }
        }
        continue;
      }

      if (!hdr && (j.includes('paycode') || j.includes('sno'))) { hdr = true; continue; }

      if (hdr && tds.length >= 10 && !isNaN(Number(tds[0])) && tds[0] !== '') {
        const ot = ExcelParser._parseOT(tds[9] || '0:0');
        rows.push({
          sno: +tds[0], payCode: tds[1].toUpperCase().trim(), cardNo: tds[2].trim(),
          employeeName: tds[3].trim(), presentDays: +tds[4] || 0, absentDays: +tds[5] || 0,
          weeklyOffDays: +tds[6] || 0, holidayDays: +tds[7] || 0, leaveDays: +tds[8] || 0,
          otHours: ot.otHours, otMinutes: ot.otMinutes, otAmount: +tds[10] || 0,
        });
      }
    }
    return { meta, rows };
  }

  static _parseRows(raw) {
    const meta = { organisationName: '', reportTitle: '', fromDate: null, toDate: null, month: null, year: null };
    const rows = [];
    let hdr = false;

    for (let i = 0; i < raw.length; i++) {
      const cells = raw[i].map(ExcelParser._strip);
      const j     = cells.join(' ').toLowerCase();
      if (i === 1 && !meta.organisationName) meta.organisationName = cells.join(' ').trim();
      if (j.includes('employee wise attendance')) {
        meta.reportTitle = cells.join(' ').trim();
        const dm = [...meta.reportTitle.matchAll(/(\d{2}-\d{2}-\d{4})/g)];
        if (dm.length >= 2) {
          meta.fromDate = ExcelParser._parseDate(dm[0][1]);
          meta.toDate   = ExcelParser._parseDate(dm[1][1]);
          if (meta.fromDate) { meta.month = meta.fromDate.getMonth() + 1; meta.year = meta.fromDate.getFullYear(); }
        }
      }
      if (!hdr && (j.includes('paycode') || j.includes('sno'))) { hdr = true; continue; }
      if (hdr && cells[0] && !isNaN(Number(cells[0]))) {
        const ot = ExcelParser._parseOT(cells[9] || '0:0');
        rows.push({
          sno: +cells[0], payCode: (cells[1] || '').toUpperCase().trim(), cardNo: (cells[2] || '').trim(),
          employeeName: (cells[3] || '').trim(), presentDays: ExcelParser._num(cells[4]),
          absentDays: ExcelParser._num(cells[5]), weeklyOffDays: ExcelParser._num(cells[6]),
          holidayDays: ExcelParser._num(cells[7]), leaveDays: ExcelParser._num(cells[8]),
          otHours: ot.otHours, otMinutes: ot.otMinutes, otAmount: ExcelParser._num(cells[10]),
        });
      }
    }
    return { meta, rows };
  }
}
