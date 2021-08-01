// import { sendToBroadcast } from "./broadcastApi";

const API_KEY =
  "608311a7737883f9e7508df50186298679cdc9b901cf3645ee46f10b4ae6cf78";

const tickersHandlers = new Map();
const cryptsocket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

let worker = new SharedWorker("sharedworker.js");

worker.port.onmessage = e => {
  const { currency, newPrice } = e.data;
  updateHandlers(currency, newPrice);
};
worker.port.start();

const AGGREGATE_INDEX = "5";
const INVALID_SUB = "500";
// eslint-disable-next-line no-unused-vars
let BTC_LINE_PRICE = 0;
// eslint-disable-next-line no-unused-vars
let BTC_LINE_CURRENCY_ARRAY = [];

cryptsocket.addEventListener("message", e => {
  const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(
    e.data
  );

  if (type === INVALID_SUB) {
    const tickersFromError = JSON.parse(e.data).PARAMETER.split("~");
    const fromTickerSum = tickersFromError[2];

    if (
      tickersHandlers.has(fromTickerSum) &&
      !BTC_LINE_CURRENCY_ARRAY.includes(fromTickerSum) &&
      fromTickerSum !== "BTC"
    ) {
      if (BTC_LINE_CURRENCY_ARRAY.length === 0) {
        subscribeToTickerOnWs("BTC");
      }
      sendToWebSocket({
        action: "SubAdd",
        subs: [`5~CCCAGG~${fromTickerSum}~BTC`]
      });
      BTC_LINE_CURRENCY_ARRAY.push(fromTickerSum);
    }
  }

  if (type != AGGREGATE_INDEX || newPrice === undefined) return;

  if (currency === "BTC") {
    BTC_LINE_PRICE = newPrice;
  }
  if (BTC_LINE_CURRENCY_ARRAY.includes(currency)) {
    const newLinePrice = newPrice * BTC_LINE_PRICE;
    return worker.port.postMessage({
      currency: currency,
      newPrice: newLinePrice
    });
  }
  worker.port.postMessage({
    currency: currency,
    newPrice: newPrice
  });
});

export function updateHandlers(currency, newPrice) {
  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach(fn => fn(newPrice));
}

function sendToWebSocket(message) {
  const stringlifyMessage = JSON.stringify(message);

  if (cryptsocket.readyState === WebSocket.OPEN) {
    cryptsocket.send(stringlifyMessage);
    return;
  }
  cryptsocket.addEventListener(
    "open",
    () => {
      cryptsocket.send(stringlifyMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWs(ticker) {
  sendToWebSocket({ action: "SubAdd", subs: [`5~CCCAGG~${ticker}~USD`] });
}

function unsubscribeToTickerOnWs(ticker) {
  sendToWebSocket({ action: "SubRemove", subs: [`5~CCCAGG~${ticker}~USD`] });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = ticker => {
  tickersHandlers.delete(ticker);
  unsubscribeToTickerOnWs(ticker);
  BTC_LINE_CURRENCY_ARRAY = BTC_LINE_CURRENCY_ARRAY.filter(item => {
    if (item === ticker) {
      sendToWebSocket({
        action: "SubRemove",
        subs: [`5~CCCAGG~${ticker}~BTC`]
      });
      item != ticker;
    }
  });
};

export async function getFullHelpTickers() {
  const dataFetchHelpTickers = await fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  );
  const dataHelpTickers = await dataFetchHelpTickers.json();
  return Object.keys(dataHelpTickers.Data);
}
