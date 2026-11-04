        <div data-sensory>
          <{{H}} class="label" style="font-size:1.375rem;margin-bottom:14px">Что сейчас больше всего достаёт?</{{H}}>
          <div class="modes">
            <button class="mode" type="button" data-mode="noise" aria-pressed="false"><strong>Шумно вокруг</strong><span>Люди, транспорт, звуки города</span></button>
            <button class="mode" type="button" data-mode="light" aria-pressed="false"><strong>Раздражает свет и картинка</strong><span>Ярко, мелькает, много визуального</span></button>
            <button class="mode" type="button" data-mode="body" aria-pressed="false"><strong>Тело не сидит на месте</strong><span>Хочется двигаться, всё чешется и мешает</span></button>
            <button class="mode" type="button" data-mode="all" aria-pressed="false"><strong>Всё разом</strong><span>Приглушим экран и включим тихий шум</span></button>
          </div>

          <div class="panel" data-panel="noise" hidden>
            <{{H2}}>Шумно вокруг</{{H2}}>
            <div class="tool__row">
              <button class="btn btn--sm" type="button" data-snd="brown" aria-pressed="false">Коричневый шум</button>
              <button class="btn btn--sm" type="button" data-snd="rain" aria-pressed="false">Дождь</button>
              <button class="btn btn--sm" type="button" data-a="stop">Стоп</button>
            </div>
            <div class="range" style="margin-top:10px">
              <label for="sVol{{ID}}">Громкость</label>
              <input type="range" id="sVol{{ID}}" data-a="vol" min="0" max="100" step="5" value="15">
              <output data-a="volout" for="sVol{{ID}}">15%</output>
            </div>
            <p class="tool__hint" data-a="note" role="status"></p>
            <ul class="tips">
              <li>Если есть наушники, надень их, даже без музыки. Уже станет тише.</li>
              <li>В транспорте или в очереди можно смотреть в одну точку.</li>
              <li>Медленно подними и опусти плечи. Пять раз.</li>
            </ul>
          </div>

          <div class="panel" data-panel="light" hidden>
            <{{H2}}>Раздражает свет и картинка</{{H2}}>
            <div class="tool__row">
              <button class="btn btn--sm btn--solid" type="button" data-a="dim" aria-pressed="false">Приглушить экран</button>
              <button class="btn btn--sm" type="button" data-a="textonly">Только текст</button>
            </div>
            <ul class="tips">
              <li>Если можно, сядь спиной к стене или к окну.</li>
              <li>Отведи взгляд вдаль на 20 секунд. Можно прикрыть глаза.</li>
              <li>Убавь яркость телефона и выключи лишние уведомления на полчаса.</li>
            </ul>
          </div>

          <div class="panel" data-panel="body" hidden>
            <{{H2}}>Тело не сидит на месте</{{H2}}>
            <div class="move">
              <p class="move__text" data-a="move" aria-live="polite">Несколько медленных движений по одному. Переходи к следующему, когда захочешь.</p>
              <p class="move__time" data-a="movetime" role="timer" aria-live="off"></p>
              <button class="btn btn--solid" type="button" data-a="next">Начать</button>
            </div>
          </div>

          <div class="panel" data-panel="all" hidden>
            <{{H2}}>Всё разом</{{H2}}>
            <p style="margin-top:12px">Экран приглушён, тихо играет коричневый шум. Можно просто посидеть. Если хочется, выбери, с чего начать сейчас:</p>
            <div class="tool__row">
              <button class="btn btn--sm" type="button" data-goto="noise">Звук</button>
              <button class="btn btn--sm" type="button" data-goto="light">Свет</button>
              <button class="btn btn--sm" type="button" data-goto="body">Тело</button>
              <a class="btn btn--sm" href="../#pauza">60 секунд тишины</a>
            </div>
            <div class="tool__row">
              <button class="btn btn--sm" type="button" data-a="dim" aria-pressed="true">Вернуть яркость</button>
              <button class="btn btn--sm" type="button" data-a="stop">Выключить звук</button>
            </div>
          </div>
        </div>
