/**
 * «Выбери цвет». Задача 35 по лабе 4, клиентская часть.
 *
 * Цвет показывают на несколько секунд, затем предлагают найти его среди
 * похожих. Отвлекающие варианты сервер строит не случайно: каждый отстоит
 * от верного на заданную разницу Delta E, и на втором уровне эта разница
 * меньше — поэтому «сложнее» здесь значит «ближе к пределу различимости»,
 * а не «больше вариантов наугад».
 *
 * Варианты показаны на нейтрально-сером поле: соседний насыщенный цвет
 * смещает восприятие оттенка, и выбор мерил бы не память, а порядок плиток.
 */

import { type GameTask, type Hex } from '@colormemo/shared';

import { GameScreen } from './GameScreen';
import type { AnswerPayload, GameSession } from './useGameSession';

export function ColorChoiceGame({ session }: { session: GameSession }) {
  return (
    <GameScreen
      session={session}
      rules="Цвет появится на несколько секунд. Затем найдите его среди похожих оттенков — засчитывается только точное попадание."
      stimulusHint="Запоминайте цвет"
      answerHint="Какой из них вы видели?"
      renderStimulus={(task) => <Stimulus task={task} />}
      renderAnswerForm={(task, answer) => <Options task={task} onAnswer={answer} />}
      renderComparison={(result) => {
        const hit = result.accuracy === 100;

        return (
          <div className="compare">
            <figure className="compare__item">
              <div className="compare__chip" style={{ background: result.correct.color }} />
              <figcaption className="compare__label">
                {hit ? 'верно — это он' : `был ${result.correct.color}`}
              </figcaption>
            </figure>

            {!hit && (
              <figure className="compare__item">
                <div className="compare__chip" style={{ background: result.given.color }} />
                <figcaption className="compare__label">вы выбрали {result.given.color}</figcaption>
              </figure>
            )}
          </div>
        );
      }}
    />
  );
}

function Stimulus({ task }: { task: GameTask }) {
  if (task.gameType !== 'COLOR_CHOICE') return null;
  return <div className="sample" style={{ background: task.targetColor }} />;
}

/**
 * Сколько вариантов в ряд. Раскладка задаётся явно, а не подбирается
 * автоматически: при автоподборе четыре варианта встают как 3 + 1,
 * и нижняя плитка оказывается в заметно других условиях, чем верхние,
 * — а сравнивать их нужно на равных.
 */
const COLUMNS: Record<number, number> = { 4: 2, 6: 3, 8: 4, 9: 3 };

function Options({
  task,
  onAnswer,
}: {
  task: GameTask;
  onAnswer: (payload: AnswerPayload) => void;
}) {
  if (task.gameType !== 'COLOR_CHOICE') return null;

  const columns = COLUMNS[task.options.length] ?? Math.ceil(Math.sqrt(task.options.length));

  return (
    <ul
      className="options"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, maxWidth: columns * 104 }}
    >
      {task.options.map((option, index) => (
        <li key={option}>
          <button
            type="button"
            className="options__item"
            style={{ background: option }}
            // Цвет словами не назовёшь, поэтому для озвучки и клавиатуры
            // остаётся номер варианта — иначе кнопка «пустая».
            aria-label={`Вариант ${index + 1}`}
            onClick={() => onAnswer({ pickedColor: option as Hex })}
          />
        </li>
      ))}
    </ul>
  );
}
