# assets/ — 이미지 넣는 곳 / where your images go

기본적으로 모든 장면은 **코드로 그린 SVG**(procedural art)를 사용합니다.
실제 그림·사진을 넣고 싶으면 여기에 파일을 두고, `js/story.js`의 해당
장면에 `image:` 한 줄만 추가하면 됩니다.

By default every scene uses **procedural SVG art** drawn in code. To use
your own drawings or photos instead, drop a file in this folder and add a
single `image:` line to that scene in `js/story.js`.

## 사용법 / How to use

```js
// js/story.js
ask: {
  art: "figure",                 // ← 이미지가 없을 때의 기본 그림 (fallback)
  image: "assets/stranger.jpg",  // ← 이 줄을 추가하면 이미지가 우선 사용됨
  ...
}
```

- `image` 가 있으면 `art` 대신 그 이미지를 배경으로 깔고, 아래쪽을 어둡게
  덮어 글자가 잘 보이게 합니다 (자동).
- 권장 비율: 세로 또는 정사각형, 어두운 톤. (예: 1080×1440, 1080×1080)
- 권장 형식: `.jpg` `.png` `.webp`

## 장면별 추천 이미지 / suggested image per scene

| scene id      | 분위기 / mood                                  |
|---------------|-----------------------------------------------|
| `ask` / `who` | 어둠 속 낯선 남자의 실루엣 (the stranger)        |
| `trepan`      | 이마에 닿는 드릴, 클로즈업 (trepanation)         |
| `awaken`      | 크게 뜬 눈 / 거리의 빛 (an open eye)            |
| `street`      | 흐릿한 군중, 네온, 비 오는 거리 (crowd)          |
| `vision_suit` | 지폐에 파묻힌 남자 (man buried in money)        |
| `vision_girl` | 실에 매달린 미소 / 마리오네트 (threads, smile)   |
| `vision_self` / `end_self` | 유리에 비친 얼굴 없는 나 (faceless reflection) |

## 🎞 영상 넣기 / Adding video

장면에 `image` 대신 `video` 를 쓰면 배경 영상이 깔립니다 (자동 재생·무음·반복):

```js
trepan: {
  video: "assets/drill.mp4",   // ← 영상이 image 보다 우선
  ...
}
```

## 📖 해설(NOTES) 이미지·영상 / images for the NOTES section

해설 섹션의 세 칸은 기본적으로 코드로 그린 그림(placeholder)입니다.
실제 이미지를 넣으려면 `index.html` 의 해당 `<figure class="media">` 안에서
`<div class="media__ph" ...>` 줄을 아래 한 줄로 **교체**하세요:

```html
<!-- 이미지 -->
<img src="assets/trepanation.jpg" alt="trepanation">
<!-- 또는 영상 -->
<video src="assets/manga.mp4" autoplay muted loop playsinline></video>
```

| 칸 | 추천 파일 / suggested file |
|----|----------------------------|
| 01 트레퍼네이션 | `assets/trepanation.jpg` — 천공술 삽화·두개골 X-ray |
| 02 호문쿨루스   | `assets/homunculus.jpg` — 대뇌 호문쿨루스 모형·연금술 판화 |
| 03 만화        | `assets/manga.jpg` — 만화 표지·한 컷 |

> ⚖️ 저작권: 만화 컷·표지·영화 스틸 등은 **본인 발표(교육) 범위**에서만 쓰고,
> 출처(작가 山本英夫, 《호문쿨루스》)를 표기하세요. 공개 배포 시 주의.

---

이미지가 없어도 사이트는 완성된 상태로 동작합니다.
The site is fully complete and playable even with **no images at all**.
