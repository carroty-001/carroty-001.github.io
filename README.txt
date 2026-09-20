DANGNI SHOP — 실제 상품 이미지 사용법

[폴더 구조]
DANGNI-SHOP/
├─ index.html
├─ style.css
├─ script.js
├─ products.json
└─ images/
   ├─ C001.png
   ├─ A001.png
   └─ ...

[상품 이미지 넣기]
1. images 폴더에 상품 이미지를 넣습니다.
2. 파일명은 상품 ID와 같게 만들면 가장 편합니다.
   예: C001.png → products.json의 C001 상품에 자동 연결
3. products.json에서 image가 같은 경로인지 확인합니다.
4. 상품 상세창에서는 images 배열에 여러 장을 넣으면 사진을 넘겨볼 수 있습니다.

예:
{
  "id": "C001",
  "name": "딸기 토끼 원피스",
  "category": "코스튬",
  "price": 5000,
  "status": "selling",
  "image": "images/C001.png",
  "images": [
    "images/C001.png",
    "images/C001-2.png",
    "images/C001-3.png"
  ]
}

[권장 이미지]
- PNG 또는 WebP
- 배경이 투명한 게임 아이템이면 특히 예쁩니다.
- 상품 카드에서는 자동으로 비율을 맞춰 표시합니다.
- 이미지가 없거나 파일명이 틀려도 기존 이모지로 자동 대체됩니다.

[850개 상품]
상품마다 ID를 정한 뒤 images 폴더에 ID와 같은 이름으로 이미지 파일을 넣고,
products.json에 상품 데이터를 추가하면 됩니다.

[다음 확장]
- 이미지 여러 장 업로드 자동화
- 엑셀/CSV → products.json 자동 변환
- 카카오톡 문의 링크 연결
- GitHub Pages 배포
