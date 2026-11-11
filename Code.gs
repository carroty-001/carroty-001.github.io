// 당그니네 밭: 공개할 상품 정보만 반환합니다. 재고메모는 반환하지 않습니다.
const DANGNI_SHEET_ID = '1jlgGsTFCeBiffAe7UDdMJFTKizMLA6ex';
const DANGNI_TAB_ID = 442445190;
function doGet() {
  try {
    const book = SpreadsheetApp.openById(DANGNI_SHEET_ID);
    const sheet = book.getSheets().find(s => s.getSheetId() === DANGNI_TAB_ID);
    if (!sheet) throw new Error('상품 시트를 찾을 수 없습니다.');
    const rows = sheet.getDataRange().getValues();
    const headers = rows.shift().map(v => String(v).trim());
    ['상품번호','상품명','카테고리','가격','판매상태','대표이미지'].forEach(h => {
      if (!headers.includes(h)) throw new Error('필수 열 누락: ' + h);
    });
    const seen = new Set();
    const products = rows.filter(row => String(row[headers.indexOf('상품명')] || '').trim()).map(row => {
      const get = h => { const i = headers.indexOf(h); return i < 0 ? '' : row[i]; };
      const rawId = String(get('상품번호')).trim();
      if (!rawId || seen.has(rawId)) throw new Error('상품번호가 비어 있거나 중복됩니다.');
      seen.add(rawId);
      const number = (v, blank) => {
        if (v === '' || v == null) return blank;
        const n = Number(String(v).replace(/,/g, ''));
        if (!Number.isFinite(n) || n < 0) throw new Error('가격 또는 할인율을 확인해주세요.');
        return n;
      };
      const image = v => {
        let s = String(v == null ? '' : v).trim();
        if (!s) return '';
        if (/^https:\/\//i.test(s)) return s;
        s = s.replace(/^images\//, '');
        if (/^\d+$/.test(s)) s += '.png';
        if (!/^[\w.\-]+\.(png|jpe?g|webp|gif)$/i.test(s)) throw new Error('대표이미지 파일명을 확인해주세요.');
        return s;
      };
      const split = v => String(v || '').split('|').map(s => s.trim()).filter(Boolean);
      const d = get('등록일');
      return {
        id: 'X' + rawId,
        name: String(get('상품명')).trim(),
        category: String(get('카테고리') || '').trim(),
        price: number(get('가격'), null),
        discount: Math.min(100, number(get('할인율(%)'), 0)),
        status: ({'판매중':'selling','판매완료':'soldout','미판매':'unavailable','selling':'selling','soldout':'soldout','unavailable':'unavailable'})[String(get('판매상태')).trim()] || 'unknown',
        image: image(get('대표이미지')),
        images: split(get('추가이미지')).map(image),
        tags: split(get('태그')),
        description: String(get('상품설명') || ''),
        date: d instanceof Date ? Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd') : String(d || ''),
        kakao: ''
      };
    });
    return jsonOutput({ok:true,products:products,updatedAt:new Date().toISOString()});
  } catch (error) {
    // 시트 내용이나 내부 오류를 공개 응답에 포함하지 않습니다.
    return jsonOutput({ok:false,error:'상품 연결 설정 또는 입력 데이터를 확인해주세요.'});
  }
}
function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
