<img src="https://github.com/user-attachments/assets/6f258d69-8f1f-4a35-9e35-1f73182b29be" width="128">

# VKClipper
революционный инструмент для того чтобы пиздить тиктоки и публиковать их ВКонтакте.

## Основные возможности

- 📥 **Загрузка видео** с TikTok по ссылкам и поиск ссылок по хештегам (```#вау #мемы #шок #какашки #даняназариков```)
- ⏰ **Автоматическая публикация** по интервалу (```1min, 10000min, 16min, N/Amin```) и по крутому расписанию (```* * * * *, 0 9-18/2 * * 1-5, * * 123e-6 * *, чееее?? там и каждый час и каждый день есть, дурак```)
- 🐩 **Поддержка 1000000000000 групп** ВКонтакте (`Эта группа для тех, кто, читая это весьма длинное и непонятное название группы, начинает осозновать, что он тратит слишком много времени в своей жизни на всякую х*рню, типо прочтения весьма длинных и непонятных названий групп...или ХВАТИТ СИДЕТЬ В ИНЕТЕ`)
- 👥 **Поддержка 1000000000000 аккаунтов** ВКонтакте (`Павел Дуров, Марьяна Рожкова, DELETED, Заблокированный Аккаунт, Агент Поддержки`)

- 🖼 **Описание** клипов

## Нано технологии:

**Серверная часть:**
- Node.js (ого!!!)
  
**Клиентская часть:**
- `@vkontakte/vkui` - VK-стилизованный интерфейс (не лагает также как на vk.com)
- React 19 - современный фронтенд (вау!!)

**ДОКЕРФАЙЛ!! (ТАКОГО ЕЩЕ НЕ БЫЛО)**

## КАК УЖЕ ЗАПУСТИТЬ?? НЕ МОГУ БОЛЬШЕ ТЕРПЕТЬ

<details>
  <summary>Запуск в докере!!!😀😃😄😁😆😅🤣😂🙂🙃😉</summary>

## Запуск с Docker (Рекомендуется)

Docker Compose **не является обязательным**, но это самый удобный способ запуска, который автоматически собирает фронтенд, внедряет адрес API, настраивает порты и гарантирует правильные права доступа (так сказал AI!!!)

### Запуск без Docker Compose (Прямые команды)

1.  **Сборка образа:** Соберите образ, передав URL клиппера (если на сервере запускаете) в `--build-arg`.
    ```bash
    # Соберите образ, указав ваш желаемый адрес API
    docker build -t vkclipper-app:latest \
      --build-arg REACT_API_URL=http://localhost:12000/ \
      .
    ```

2.  **Запуск контейнера:** Запустите контейнер, с портом 12000.
    ```bash
    docker run -d \
      --name vkclipper-bot \
      -p 12000:12000 \
      vkclipper-app:latest
    ```

### Запуск с Docker Compose (Удобный метод)

1.  В файле `docker-compose.yml` настройте сервис `vkclipper`, указав адрес API в секции `args`:

    ```yaml
    services:
      vkclipper:
        build:
          context: . 
          dockerfile: Dockerfile
          args: 
            REACT_API_URL: http://localhost:12000/
        container_name: vkclipper_bot
        restart: unless-stopped
        ports: 
          - "12000:12000"
    ```

2.  Запустите сборку и контейнер в корне проекта:
    ```bash
    docker compose up -d --build
    ```
    > **ПРИМЕЧАНИЕ:** Флаг `--build` нужен только при первом запуске или при изменении `REACT_API_URL`.

</details>

**Просто Zапуск:**
1. Скачать репо в папку clipper
2. Открыть там cmd
3. Запустить скрипт
```bash
npm install
node server.js
```

**Собрать фронт под другой apiurl:**
   1. Поменять url в конце [ClipperApp/src/Components/API.js](https://github.com/nazarikovd/VKClipper/blob/main/ClipperApp/src/Components/API.js)
```javascript
let apiBaseUrl = 'http://localhost:12000/';
```
   2. Собрать фронт апп:
```bash
cd ClipperApp
npm install
npm build
```
  3. Переместить папку /ClipperApp/build в корень к server.js (/build)
   
   

## Использование

По умолчанию запускается на http://localhost:12000/

0. Добавить аккаунт админа группы по кукам (инструкция там)
1. Добавить группу в Группы
2. Достать ссылки из Scrap по тегу
3. Положить ссылки в TikTok
4. Наслаждение

## требования

- верифицированная запись на гос услугах
- водительский стаж 3 года
- подписка на дугщ
- биометрия в сбере

## ОГО!!!

<details>
  <summary>Скришотики</summary>
  
![image](https://github.com/user-attachments/assets/b909a4e6-77c8-4f99-8502-2216b2624b29)
![image](https://github.com/user-attachments/assets/e173d428-b143-4d1c-98e6-aca179cc9590)
![image](https://github.com/user-attachments/assets/da71d741-819e-4145-bb6f-40eff9ec8eb2)
![image](https://github.com/user-attachments/assets/b0e40057-4616-47d0-b5e5-67a6de1f9008)
![image](https://github.com/user-attachments/assets/afbf1e97-39fa-4b1a-829b-eef9b4036d26)
![image](https://github.com/user-attachments/assets/e3bd4242-b286-4fb8-99ac-b4299b75ed53)
![image](https://github.com/user-attachments/assets/b6a3e8f9-1df0-448b-bee8-44929beb8add)
![image](https://github.com/user-attachments/assets/c9118e9b-0825-4759-b3b2-b1b58e181602)

</details>

<details>
  <summary>Стата группы после такого энтертеймента</summary>
  
![image](https://github.com/user-attachments/assets/c18a647f-a6b6-4b07-913a-281aa6b2a820)
![image](https://github.com/user-attachments/assets/a08bae80-188e-45a8-aa84-8b936497be1a)

</details>







