/**
 * Вычисляет, как долго играли в двойном режиме (2x).
 * При скорости 2x за одно реальное минуту проходит 2 минуты контента.
 *
 * @param {number} realMinutes - реальное время в минутах (сколько времени прошло по часам)
 * @param {number} speed - множитель скорости (2 = "двойной" режим)
 * @returns {{ realMinutes: number, contentMinutes: number }} реальное время и эквивалентная длительность контента
 */
export function calcDoublePlayTime(realMinutes, speed = 2) {
  if (realMinutes < 0 || speed <= 0) {
    return { realMinutes: 0, contentMinutes: 0 };
  }
  const contentMinutes = realMinutes * speed;
  return { realMinutes, contentMinutes };
}

/**
 * Обратный расчёт: по длительности контента и скорости даёт реальное время.
 *
 * @param {number} contentMinutes - длительность контента в минутах
 * @param {number} speed - множитель скорости (2 = двойной)
 * @returns {{ realMinutes: number, contentMinutes: number }}
 */
export function calcRealPlayTime(contentMinutes, speed = 2) {
  if (contentMinutes < 0 || speed <= 0) {
    return { realMinutes: 0, contentMinutes: 0 };
  }
  const realMinutes = contentMinutes / speed;
  return { realMinutes, contentMinutes };
}

/**
 * Форматирует минуты в строку "Ч ч М мин".
 */
export function formatDuration(minutes) {
  if (minutes < 0) return '0 мин';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
