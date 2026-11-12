/**
 * «Повтори цвет». Задача 36 по лабе 4, клиентская часть.
 *
 * Цвет показывают на несколько секунд, затем его надо собрать заново
 * пипеткой. Точность считает сервер по Delta E 2000, то есть по тому,
 * насколько цвета различны для глаза, а не по разнице чисел в RGB.
 *
 * Весь ход раунда берётся из общего цикла (useGameSession), здесь только
 * то, что относится к этой игре.
 */

import { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import { readableTextColor, type GameTask, type Hex } from '@colormemo/shared';

import { GameScreen } from './GameScreen';
import type { AnswerPayload, GameSession } from './useGameSession';

/**
 * С какого цвета начинается подбор. Нейтральный серый выбран нарочно:
 * любой стартовый оттенок тянул бы ответ к себе, и игра мерила бы не память,
 * а то, насколько цвет задания похож на начальный.
 */
const NEUTRAL_START = '#808080';

export function ColorRecallGame({ session }: { session: GameSession }) {
  return (
    <GameScreen
      session={session}
      rules="Цвет появится на несколько секунд. Запомните его и соберите заново — чем ближе оттенок, тем выше точность."
      stimulusHint="Запоминайте цвет"
      answerHint="Соберите тот же цвет"
      renderStimulus={(task) => <Stimulus task={task} />}
      renderAnswerForm={(task, answer) => <Picker key={task.attemptId} onAnswer={answer} />}
      renderComparison={(result) => (
        <div className="compare">
          <figure className="compare__item">
            <div className="compare__chip" style={{ background: result.correct.color }} />
            <figcaption className="compare__label">было {result.correct.color}</figcaption>
          </figure>
          <figure className="compare__item">
            <div className="compare__chip" style={{ background: result.given.color }} />
            <figcaption className="compare__label">вы собрали {result.given.color}</figcaption>
          </figure>
        </div>
      )}
    />
  );
}

function Stimulus({ task }: { task: GameTask }) {
  if (task.gameType !== 'COLOR_RECALL') return null;
  return <div className="sample" style={{ background: task.targetColor }} />;
}

function Picker({ onAnswer }: { onAnswer: (payload: AnswerPayload) => void }) {
  const [picked, setPicked] = useState<string>(NEUTRAL_START);

  // Новый раунд — новый компонент (key по attemptId), но на всякий случай
  // возвращаем пипетку в нейтральное положение и при повторном показе.
  useEffect(() => setPicked(NEUTRAL_START), []);

  return (
    <div className="picker">
      <HexColorPicker color={picked} onChange={setPicked} />

      <div
        className="picker__preview"
        style={{ background: picked, color: readableTextColor(picked as Hex) }}
      >
        {picked}
      </div>

      <button
        type="button"
        className="button"
        onClick={() => onAnswer({ pickedColor: picked as Hex })}
      >
        Ответить
      </button>
    </div>
  );
}
