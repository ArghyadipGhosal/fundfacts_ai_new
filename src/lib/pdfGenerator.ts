import type { CommentaryData } from '@/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateCommentaryPDF(commentary: CommentaryData): Promise<string> {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0; width: 794px; min-height: 1123px;
    background: white; font-family: 'Georgia', 'Times New Roman', serif;
    color: #1a1a1a; padding: 0; margin: 0; box-sizing: border-box; overflow: hidden;
  `;
  container.innerHTML = renderCommentaryHTML(commentary);
  document.body.appendChild(container);

  try {
    await document.fonts.ready;
    const canvas = await html2canvas(container, {
      scale: 2, useCORS: true, logging: false,
      backgroundColor: '#ffffff', width: 794, height: 1123,
    });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, 210, 297);
    const pdfBlob = pdf.output('blob');
    return URL.createObjectURL(pdfBlob);
  } finally {
    document.body.removeChild(container);
  }
}

function renderCommentaryHTML(c: CommentaryData): string {
  const { fundInfo, fundManagerTeam, strategy, performanceAttribution, benchmarkComparison, outlook, quarter, year } = c;
  const periodText = quarter && year ? `${quarter} ${year}` : 'Current Period';

  return `<div style="width: 794px; height: 1123px; background: white; position: relative; overflow: hidden; box-sizing: border-box;">
    <div style="background: #0f766e; padding: 18px 36px 14px; color: white;">
      <div style="border-bottom: 1.5px solid rgba(255,255,255,0.25); padding-bottom: 12px;">
        <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 2.5px; opacity: 0.85; margin-bottom: 3px;">Fund Manager Commentary</div>
        <div style="font-size: 20px; font-weight: bold; letter-spacing: -0.3px; line-height: 1.15;">${fundInfo.fundName || 'Mutual Fund'}</div>
        <div style="font-size: 11px; opacity: 0.8; margin-top: 3px;">${fundInfo.amcName || ''} &nbsp;|&nbsp; ${periodText} &nbsp;|&nbsp; ${fundInfo.fundCategory || ''}</div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 10px;">
        <div style="text-align: center; flex: 1;"><div style="opacity: 0.65; font-size: 9px; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.5px;">Benchmark</div><div style="font-weight: bold; font-size: 10px;">${fundInfo.benchmark || 'N/A'}</div></div>
        <div style="width: 1px; background: rgba(255,255,255,0.25);"></div>
        <div style="text-align: center; flex: 1;"><div style="opacity: 0.65; font-size: 9px; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.5px;">AUM</div><div style="font-weight: bold; font-size: 10px;">${fundInfo.aum || 'N/A'}</div></div>
        <div style="width: 1px; background: rgba(255,255,255,0.25);"></div>
        <div style="text-align: center; flex: 1;"><div style="opacity: 0.65; font-size: 9px; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.5px;">Expense Ratio</div><div style="font-weight: bold; font-size: 10px;">${fundInfo.expenseRatio || 'N/A'}</div></div>
        <div style="width: 1px; background: rgba(255,255,255,0.25);"></div>
        <div style="text-align: center; flex: 1;"><div style="opacity: 0.65; font-size: 9px; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.5px;">Risk</div><div style="font-weight: bold; font-size: 10px;">${fundInfo.riskProfile || 'N/A'}</div></div>
      </div>
    </div>
    <div style="padding: 14px 36px;">
      <div style="margin-bottom: 10px;">
        <div style="font-size: 11px; font-weight: bold; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 5px;">Fund Manager Team</div>
        <div style="font-size: 10px; line-height: 1.5; color: #374151;">${fundManagerTeam}</div>
      </div>
      <div style="margin-bottom: 10px;">
        <div style="font-size: 11px; font-weight: bold; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 5px;">Strategy</div>
        <div style="font-size: 10px; line-height: 1.5; color: #374151;">${strategy}</div>
      </div>
      <div style="margin-bottom: 10px;">
        <div style="font-size: 11px; font-weight: bold; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 5px;">Performance Attribution</div>
        <div style="font-size: 10px; line-height: 1.45; color: #374151; margin-bottom: 6px;">${performanceAttribution.summary}</div>
        <div style="background: #ecfdf5; border-left: 3px solid #059669; border-radius: 0 6px 6px 0; padding: 6px 10px; margin-bottom: 5px;">
          <div style="font-size: 9px; font-weight: bold; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Top Contributors</div>
          ${performanceAttribution.topPerformers.map(p => `
            <div style="margin-bottom: 5px;">
              <div style="font-size: 10px; font-weight: bold; color: #1a1a1a;">${p.name}</div>
              ${p.specifics ? `<div style="font-size: 9px; color: #059669; font-style: italic; margin: 1px 0;">${p.specifics}</div>` : ''}
              <div style="font-size: 9px; color: #374151; line-height: 1.4;"><strong style="color: #059669;">${p.contribution}</strong> — ${p.reason}</div>
            </div>
          `).join('')}
        </div>
        <div style="background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 0 6px 6px 0; padding: 6px 10px; margin-bottom: 5px;">
          <div style="font-size: 9px; font-weight: bold; color: #dc2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Bottom Detractors</div>
          ${performanceAttribution.bottomPerformers.map(p => `
            <div style="margin-bottom: 5px;">
              <div style="font-size: 10px; font-weight: bold; color: #1a1a1a;">${p.name}</div>
              ${p.specifics ? `<div style="font-size: 9px; color: #dc2626; font-style: italic; margin: 1px 0;">${p.specifics}</div>` : ''}
              <div style="font-size: 9px; color: #374151; line-height: 1.4;"><strong style="color: #dc2626;">${p.contribution}</strong> — ${p.reason}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="margin-bottom: 10px;">
        <div style="font-size: 11px; font-weight: bold; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 5px;">Benchmark Comparison</div>
        <div style="font-size: 10px; line-height: 1.5; color: #374151;">${benchmarkComparison}</div>
      </div>
      <div style="margin-bottom: 10px;">
        <div style="font-size: 11px; font-weight: bold; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 5px;">Outlook</div>
        <div style="font-size: 10px; line-height: 1.5; color: #374151;">${outlook}</div>
      </div>
    </div>
    <div style="background: #f9fafb; padding: 8px 36px; border-top: 1px solid #e5e7eb; position: absolute; bottom: 0; left: 0; right: 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #9ca3af;">
        <div>Generated by FundFacts AI</div><div>For informational purposes only. Not investment advice.</div>
      </div>
    </div>
  </div>`;
}

export function downloadPDF(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
