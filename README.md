## Команды для запуска:

<pre>
- `npm run app`:              Запускает приложение `app`.
- `npm run sync`:             Запускает приложение `sync` в режиме реального времени.
- `npm run sync:reindex`:     Запускает приложение `sync` в режиме полной синхронизации (`--full-reindex`).
</pre>



# Задача

Предположим, у нас интернет-магазин. Мы храним данные о покупателях в коллекции mongodb. Эти данные содержат много чувствительной персональной информации. Чтобы обеспечить максимальную безопасность, мы хотим, чтобы разработчики имели доступ к свежим записям в этой коллекции, но не имели доступ к персональным данным.

Для решения этой задачи вам нужно создать сервис, который будет следить за появлением и изменением документов в этой коллекции и копировать их в другую, анонимизируя при этом часть полей.

## Структура БД

В mongodb есть коллекция `customers`, где создаются документы такого вида.

<pre>
{
  "_id": ObjectId("64155ece0ac406903b7eb4a1"),
  "firstName": "Cindy",
  "lastName": "Doyle",
  "email": "Cindy.Doyle@hotmail.com",
  "address": {
    "line1": "34801 Kurt Spur",
    "line2": "Suite 028",
    "postcode": "45081",
    "city": "Hailieberg",
    "state": "NY",
    "country": "US"
  },
  "createdAt": ISODate("2022-12-11T19:08:41.683Z")
}
</pre>
<pre>
Рядом находится коллекция customers_anonymised. Куда попадают такие документы.
{
  "_id": ObjectId("64155ece0ac406903b7eb4a1"),
  "firstName": "Lba7yaBf",
  "lastName": "mn1aMji3",
  "email": "V83AkoCj@hotmail.com",
  "address": {
    "line1": "cHyd22Ji",
    "line2": "pPa0Ui3b",
    "postcode": "oO15sD6F",
    "city": "Hailieberg",
    "state": "NY",
    "country": "US"
  },
  "createdAt": ISODate("2023-03-20T19:08:41.683Z")
}
</pre>

## Приложение `app.ts`

Это приложение эмулирует работу нашего магазина.

- Приложение вечно генерирует покупателей и вставляет их в БД.
- Для генерации используется библиотека ****[Faker](https://www.npmjs.com/package/@faker-js/faker)****.
- Покупатели создаются случайными пачками по 1 - 10 покупателей каждые 200 миллисекунд, и так же пачками вставляются в коллекцию `customers`.

## Приложение `sync.ts`

Это приложение копирует и анонимизирует покупателей.

- Приложение “слушает” появление и **изменение** документов в коллекции `customers` и анонимизирует их:
    - Заменяются содержимое полей `firstName`, `lastName`, часть до `@` в поле `email`, `address.line1`, `address.line2` и `postcode`.
    - Значения заменяются на 8-значную псевдослучайную, но детерминированную последовательность символов `[a-zA-Z\d]`.
- После анонимизации записи вставляются в `customers_anonymised` следующим образом:
    - Приложение накапливает пачки по 1,000 документов.
    - Если не удалось накопить пачку за 1 секунду, то вставляется то что есть.
- Приложение может быть перезапущено. В случае перезапуска оно должно продолжить с того места где остановилось, не пропустив те изменения, которые случились пока приложение было оффлайн.
- Приложение можно запустить в двух режимах:
    - Реалтайм синхронизация. Это дефолтное поведение, которое описано выше. Оно работает, если `sync.ts` запущен без аргументов.
    - Полная синхронизация. Включается, при наличии флага `--full-reindex`. В этом режиме приложение вместо того чтобы слушать изменения, должно запуститься и перелить все данные пачками по 1000 документов, анонимизировов их. В случае успеха, приложение завершает свою работу с кодом `0`.
- Оба режима могут работать параллельно. То есть одновременно можно запустить два инстанса — один в реалтайме, второй в режиме полной синхронизации.
- Документы в коллекции `customers` не удаляются, не стоит предусматривать поведение на этот случай.
