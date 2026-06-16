/* =====================================================================
   제3의 눈 · THIRD EYE — STORY GRAPH
   ---------------------------------------------------------------------
   The whole narrative lives here so it is easy to edit, translate and
   extend without touching the engine (js/main.js).

   SCENE SHAPE
   {
     art:      'figure' | 'eye' | 'drill' | 'awaken' | 'street'
               | 'money' | 'threads' | 'mirror' | 'void',   // procedural visual
     image:    'assets/your-image.jpg',   // OPTIONAL — overrides `art` if set
     speaker:  { ko, en } | null,         // who is talking
     text:     { ko, en } | (state) => ({ ko, en }),
     depth:    0–100,                     // fills the DEPTH meter
     glitch:   true,                      // distortion on enter
     flash:    true,                      // white flash on enter
     auto:     2600,                      // ms -> auto-advance to `next`
     next:     'sceneId',                 // used by auto / single-continue
     choices:  [ Choice ] | (state) => [ Choice ],
     ending:   { ko, en } | null          // shows ending label + RESTART
   }

   CHOICE SHAPE
   {
     ko, en,                 // labels
     to: 'sceneId',
     tone: 'normal' | 'danger' | 'whisper',
     requires: ['id', ...],  // only show if ALL these scenes were visited
     hideIfVisited: true     // hide once its target was visited
   }

   To use your OWN images: drop files into /assets and set `image:` on a
   scene. See assets/README.md.
   ===================================================================== */

window.STORY = {
  start: "ask",

  scenes: {
    /* ---------------------------------------------------------------- */
    ask: {
      art: "figure",
      image: "assets/man.jpg",
      depth: 8,
      speaker: { ko: "???", en: "A STRANGER" },
      text: {
        ko: "거기, 당신. ……당신의 [[제3의 눈]]을 열어 드릴까요?",
        en: "You there. …Shall I open your third eye?",
      },
      choices: [
        { ko: "「열어주세요」", en: "Open it", to: "trepan", tone: "danger" },
        { ko: "「당신은 누구죠?」", en: "Who are you?", to: "who" },
        { ko: "「됐어요」", en: "No, thank you", to: "refuse", tone: "whisper" },
      ],
    },

    /* ---------------------------------------------------------------- */
    who: {
      art: "figure",
      image: "assets/man.jpg",
      depth: 10,
      speaker: { ko: "그 남자", en: "THE MAN" },
      text: {
        ko: "이름은 중요하지 않아요. 나는 그저… 당신이 [[아직 보지 못한 것]]을 보여줄 수 있는 사람이죠. 사람들의 겉모습 아래에 무엇이 있는지. 그들의 진짜 형태 말입니다.",
        en: "Names don't matter. I am simply… someone who can show you what you have not yet seen. What lies beneath people's surfaces. Their true shape.",
      },
      choices: [
        { ko: "「열어주세요」", en: "Open it", to: "trepan", tone: "danger" },
        { ko: "「거절한다」", en: "Refuse", to: "refuse", tone: "whisper" },
      ],
    },

    /* ---------------------------------------------------------------- */
    refuse: {
      art: "figure",
      image: "assets/man.jpg",
      depth: 6,
      speaker: { ko: "그 남자", en: "THE MAN" },
      text: {
        ko: "그래요. 대부분은 그렇게 말하죠. 하지만 한번 알게 되면, 다시는 [[모르던 때]]로 돌아갈 수 없어요. ……정말, 가시겠어요?",
        en: "I see. Most people say that. But once you know, you can never return to not knowing. …Will you really leave?",
      },
      choices: [
        { ko: "「역시, 열어주세요」", en: "On second thought… open it", to: "trepan", tone: "danger" },
        { ko: "「떠난다」", en: "Leave", to: "end_refuse", tone: "whisper" },
      ],
    },

    /* ---------------------------------------------------------------- */
    end_refuse: {
      art: "void",
      depth: 20,
      speaker: null,
      text: {
        ko: "당신은 돌아섰다. 세상은 어제와 똑같아 보였다. 그러나 가끔, 사람들의 얼굴이 흐릿하게 일그러지는 것을 느꼈다. 보지 않기로 한 것은, 보지 못하는 것과 다르다.",
        en: "You turned away. The world looked the same as yesterday. Yet sometimes you felt people's faces blur and distort. To choose not to see is not the same as being unable to see.",
      },
      ending: { ko: "結末 · 외면", en: "ENDING — AVERSION" },
    },

    /* ---------------------------------------------------------------- */
    trepan: {
      art: "drill",
      video: "assets/trepanation.mp4",
      depth: 40,
      glitch: true,
      flash: true,
      speaker: null,
      text: {
        ko: "차가운 금속이 이마에 닿는다. 작은 진동. 뼈를 파고드는 소리. 그리고——",
        en: "Cold metal touches your forehead. A small vibration. The sound of something boring into bone. And then——",
      },
      auto: 3200,
      next: "awaken",
    },

    /* ---------------------------------------------------------------- */
    awaken: {
      art: "awaken",
      depth: 55,
      flash: true,
      speaker: { ko: "그 남자", en: "THE MAN" },
      text: {
        ko: "눈을 떠보세요. 처음엔 아무것도 달라 보이지 않을 거예요. 거리, 사람들, 소음. ……하지만 왼쪽 눈을 감고 오른쪽 눈으로 보면, 그들의 [[진짜 형태]]가 드러납니다.",
        en: "Open your eyes. At first nothing will seem different — the street, the people, the noise. …But close your left eye, look with your right, and their true shape is revealed.",
      },
      choices: [
        { ko: "「거리로 나간다」", en: "Step into the street", to: "street" },
      ],
    },

    /* ---------------------------------------------------------------- */
    street: {
      art: "street",
      image: "assets/street.jpg",
      depth: 62,
      timer: false,
      speaker: null,
      text: (s) => {
        const seenBoth = s.visited.has("vision_suit") && s.visited.has("vision_girl");
        return seenBoth
          ? {
              ko: "더 이상 들여다볼 사람이 없다. 거리는 텅 비어가고, 남은 것은 유리에 비친 [[하나의 형체]]뿐이다.",
              en: "There is no one left to look into. The street empties, and all that remains is a single figure in the glass.",
            }
          : {
              ko: "거리는 사람들로 가득하다. 오른쪽 눈이 욱신거린다. ……누구를 들여다볼까?",
              en: "The street is full of people. Your right eye throbs. …Whose shape will you look into?",
            };
      },
      choices: (s) => {
        const list = [
          { ko: "정장을 입은 남자", en: "The man in the suit", to: "vision_suit", hideIfVisited: true },
          { ko: "웃고 있는 소녀", en: "The smiling girl", to: "vision_girl", hideIfVisited: true },
        ];
        const seenBoth = s.visited.has("vision_suit") && s.visited.has("vision_girl");
        list.push(
          seenBoth
            ? { ko: "유리에 비친 당신", en: "Your reflection in the glass", to: "vision_self", tone: "danger" }
            : { ko: "유리에 비친 무언가", en: "Something in the glass", to: "vision_self", tone: "whisper" }
        );
        return list;
      },
    },

    /* ---------------------------------------------------------------- */
    vision_suit: {
      art: "money",
      video: "assets/salaryman.mp4",
      videoFit: "contain",
      depth: 72,
      glitch: true,
      speaker: { ko: "관찰 · 회사원", en: "OBSERVED — THE SALARYMAN" },
      text: {
        ko: "그의 몸은 빳빳한 지폐로 뒤덮여 있다. 한 장씩 떨어질 때마다 그는 조금씩 [[작아진다]]. 아무리 움켜쥐어도 손가락 사이로 빠져나간다. 그는 텅 빈 눈으로 웃고 있었다.",
        en: "His body is plastered with crisp banknotes. With each one that falls, he shrinks a little. No matter how he clutches, they slip between his fingers. He was smiling with hollow eyes.",
      },
      choices: [
        { ko: "「거리로 돌아간다」", en: "Return to the street", to: "street" },
      ],
    },

    /* ---------------------------------------------------------------- */
    vision_girl: {
      art: "threads",
      video: "assets/girl.mp4",
      videoFit: "contain",
      depth: 74,
      glitch: true,
      speaker: { ko: "관찰 · 소녀", en: "OBSERVED — THE GIRL" },
      text: {
        ko: "소녀의 미소 아래로, 수천 개의 가느다란 [[실]]이 입꼬리를 끌어올리고 있다. 실은 그녀의 손이 아니라, 보이지 않는 누군가의 손에서 뻗어 나온다. 그녀는 한 번도 스스로 웃은 적이 없었다.",
        en: "Beneath the girl's smile, thousands of thin threads hoist the corners of her mouth. They extend not from her own hands, but from someone unseen. She had never once smiled on her own.",
      },
      choices: [
        { ko: "「거리로 돌아간다」", en: "Return to the street", to: "street" },
      ],
    },

    /* ---------------------------------------------------------------- */
    vision_self: {
      art: "mirror",
      image: "assets/reflection.jpg",
      depth: 86,
      speaker: null,
      text: {
        ko: "당신은 멈춰 선다. 유리에 비친 당신을 보기 위해, 천천히 오른쪽 눈을 뜬다. 거기에는——",
        en: "You stop. Slowly, you open your right eye to look at the you reflected in the glass. And there——",
      },
      choices: [
        { ko: "「본다」", en: "Look", to: "end_self", tone: "danger" },
        { ko: "「눈을 감는다」", en: "Close your eyes", to: "end_blind", tone: "whisper" },
      ],
    },

    /* ---------------------------------------------------------------- */
    end_self: {
      art: "void",
      image: "assets/faceless.jpg",
      depth: 100,
      glitch: true,
      flash: true,
      speaker: null,
      text: {
        ko: "유리 속의 당신에게는 얼굴이 없었다. 이마 한가운데, 검은 구멍 하나가 당신을 마주 보고 있었다. 가장 보기 두려웠던 형태는, 언제나 [[당신 자신]]이었다.",
        en: "The you in the glass had no face. At the center of its forehead, a single black hole stared back. The shape you feared to see most was always yourself.",
      },
      ending: { ko: "結末 · 자각", en: "ENDING — RECOGNITION" },
    },

    /* ---------------------------------------------------------------- */
    end_blind: {
      art: "void",
      depth: 90,
      speaker: null,
      text: {
        ko: "당신은 눈을 감았다. 타인의 형태는 볼 수 있어도, 자신의 형태만은 끝내 보지 못했다. 어쩌면 그것이, 인간이 살아가는 방식인지도 모른다.",
        en: "You closed your eyes. You could see the shape of others, yet never your own. Perhaps that is simply how people survive.",
      },
      ending: { ko: "結末 · 회피", en: "ENDING — EVASION" },
    },
  },
};
