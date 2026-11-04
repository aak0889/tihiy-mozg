        <div data-park{{NIGHT}}>
          <label class="label" for="parkText{{ID}}">{{LABEL}}</label>
          <textarea class="field" id="parkText{{ID}}" data-p="text" rows="6"></textarea>
          <p class="saved" data-p="saved" role="status"></p>
          <div class="tool__row">
            <button class="btn btn--solid" type="button" data-p="park">Поставить на парковку</button>
            {{SLEEP}}
          </div>
          <p class="tool__msg" data-p="msg" role="status" aria-live="polite"></p>
          <p class="sleep-done" data-p="sleepDone" tabindex="-1" hidden>Всё записано и лежит здесь. Утром можно вернуться к списку. Спокойной ночи.</p>
          <p class="tool__hint" data-p="count"></p>
          <ul class="park__list" data-p="list" aria-label="Мысли на парковке"></ul>
          <div class="tool__row" data-p="actions" hidden>
            <button class="btn btn--sm" type="button" data-p="keep">Оставить здесь</button>
            <button class="btn btn--sm" type="button" data-p="sortBtn" aria-pressed="false">Разобрать (по желанию)</button>
            <button class="btn btn--sm" type="button" data-p="export">Выгрузить и стереть</button>
          </div>
          <div class="confirm" data-p="exportConfirm" hidden>
            <p>Копирую…</p>
            <a class="btn btn--sm" data-p="download" href="#" download>Скачать .txt</a>
            <button class="btn btn--sm btn--solid" type="button" data-yes>Да, стереть всё</button>
            <button class="btn btn--sm" type="button" data-no>Нет, оставить</button>
          </div>
          <div class="cols" data-p="cols" hidden>
            <div class="col"><h3>Сделать</h3><ul data-col="do"></ul></div>
            <div class="col"><h3>Подумать</h3><ul data-col="think"></ul></div>
            <div class="col"><h3>Отпустить</h3><ul data-col="go"></ul></div>
          </div>
          <div class="tool__row">
            <button class="linkish" type="button" data-p="erase">Всё стереть</button>
            <a class="linkish" href="{{NEXTLINK}}">Куда мне с этим дальше</a>
          </div>
          <div class="confirm" data-p="confirm" hidden>
            <p>Стереть все мысли и черновик из этого браузера?</p>
            <button class="btn btn--sm btn--solid" type="button" data-yes>Да, стереть всё</button>
            <button class="btn btn--sm" type="button" data-no>Нет, оставить</button>
          </div>
        </div>
