/**
 * Главная страница.
 *
 * Образцы цвета на странице не выдуманы: они берутся теми же функциями,
 * что и задания в играх, а процент точности считается настоящей формулой
 * из общего пакета. Поэтому при каждом открытии цвета разные, а пример
 * на странице всегда честный.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { colorAccuracy, colorAtDeltaE, randomTargetColor } from '@colormemo/shared';

import { GAME_CATALOG, STATUS_LABELS } from '../features/games/catalog';
import { ROUTES, gamePath } from '../routes';
import './HomePage.css';

export function HomePage() {
  const sample = useMemo(() => {
    const heroColor = randomTargetColor();

    // Разница в 6,5 — примерно столько набирает человек, который
    // вспомнил цвет хорошо, но не идеально.
    const shown = randomTargetColor();
    const remembered = colorAtDeltaE(shown, 6.5);

    return {
      heroColor,
      shown,
      remembered,
      accuracy: Math.round(colorAccuracy(shown, remembered)),
    };
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__sample" style={{ background: sample.heroColor }} />

          <div>
            <h1 className="hero__title">Запомнить цвет труднее, чем кажется</h1>

            <p className="hero__text">
              Короткие задания на память и различение оттенков. Две минуты, результат в процентах, и
              видно, в какую сторону вы промахиваетесь.
            </p>

            <Link to={ROUTES.games} className="hero__cta">
              Выбрать игру
            </Link>
          </div>
        </div>
      </section>

      <section className="explain">
        <div className="explain__inner">
          <h2>Точность считается так, как видит глаз</h2>

          <div className="explain__row">
            <div className="explain__item">
              <div className="explain__chip" style={{ background: sample.shown }} />
              <span className="explain__label">показали</span>
            </div>

            <div className="explain__item">
              <div className="explain__chip" style={{ background: sample.remembered }} />
              <span className="explain__label">вы подобрали</span>
            </div>

            <div className="explain__item">
              <span className="explain__score">{sample.accuracy}%</span>
              <span className="explain__label">точность</span>
            </div>
          </div>

          <p>
            Разницу между цветами нельзя мерить по числам, которыми цвет записан в компьютере: у
            синих оттенков глаз почти не замечает того, что у жёлтых бросается в глаза. Поэтому
            цвета сравниваются по тому, насколько они различаются для человека, и промах на полтона
            всегда стоит одинаково — в любой части цветового круга.
          </p>
        </div>
      </section>

      <section className="games-teaser">
        <div className="games-teaser__inner">
          <h2>Игры</h2>

          <ul className="teaser-list">
            {GAME_CATALOG.map((game) => {
              const available = game.status !== 'planned';
              const chip = randomTargetColor();

              const content = (
                <>
                  <div className="teaser__chip" style={{ background: chip }} />
                  <div>
                    <div className="teaser__name">{game.title}</div>
                    <p className="teaser__about">{game.description}</p>
                  </div>
                  <span className="teaser__state">{STATUS_LABELS[game.status]}</span>
                </>
              );

              return (
                <li key={game.slug}>
                  {available ? (
                    <Link to={gamePath(game.slug)} className="teaser">
                      {content}
                    </Link>
                  ) : (
                    <div className="teaser">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
